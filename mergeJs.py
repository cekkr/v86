import os
import sys
import json
from esprima import parseScript, parseModule
import escodegen

import os
import re

def merge_js_files_normal(directory, output_file):
    """
    Unisce tutti i file JS in una directory e nelle sue sottodirectory,
    rimuovendo solo le linee di import e le keyword export in modo sicuro.
    
    Args:
        directory (str): Il percorso della directory da scansionare
        output_file (str): Il percorso del file di output
    """
    # Lista per salvare i contenuti dei file
    merged_content = []
    
    # Percorre ricorsivamente la directory
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith('.js'):
                file_path = os.path.join(root, file)
                print(f"Elaborazione del file: {file_path}")
                
                # Legge il contenuto del file
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Rimuove le dichiarazioni import, gestendo correttamente il multilinea
                # Prima identifica gli statement import completi
                import_matches = list(re.finditer(r'import\s+(?:{[^}]*}|\*\s+as\s+\w+|\w+)\s+from\s+["\'][^"\']+["\'];', content))
                import_matches += list(re.finditer(r'import\s+["\'][^"\']+["\'];', content))
                
                # Rimuove gli import trovati, partendo dall'ultimo per non alterare gli indici
                for match in reversed(import_matches):
                    start, end = match.span()
                    content = content[:start] + content[end:]
                
                # Gestisce i blocchi import multilinea
                content = re.sub(r'import\s+{[\s\S]*?}\s+from\s+["\'][^"\']+["\'];', '', content)
                
                # Rimuove il keyword export preservando il resto della dichiarazione
                content = re.sub(r'(^|\s)export\s+(?=(?:const|let|var|function|class|default|async))', r'\1', content, flags=re.MULTILINE)
                content = re.sub(r'(^|\s)export\s+default\s+', r'\1', content, flags=re.MULTILINE)
                
                # Aggiunge il contenuto elaborato alla lista
                merged_content.append(f"\n// ---- File: {file_path} ----\n")
                merged_content.append(content + "\n")
    
    # Scrive tutti i contenuti nel file di output
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(''.join(merged_content))
    
    print(f"Unione completata! Il file di output è: {output_file}")


def extract_imports(file_content, file_dir):
    """
    Estrae i percorsi di import da un file JavaScript.
    
    Args:
        file_content (str): Contenuto del file JS
        file_dir (str): Directory del file per risolvere percorsi relativi
        
    Returns:
        list: Lista dei percorsi dei file importati
    """
    imports = []
    
    # Pattern per catturare gli import
    import_patterns = [
        r'import\s+(?:{[^}]*}|\*\s+as\s+\w+|\w+)\s+from\s+["\']([^"\']+)["\'];',  # import standard
        r'import\s+["\']([^"\']+)["\'];'  # import senza binding
    ]
    
    for pattern in import_patterns:
        matches = re.finditer(pattern, file_content)
        for match in matches:
            import_path = match.group(1)
            
            # Se il percorso è relativo, lo risolve rispetto alla directory del file
            if import_path.startswith('./') or import_path.startswith('../'):
                abs_path = os.path.normpath(os.path.join(file_dir, import_path))
            else:
                # Percorso assoluto o da node_modules
                abs_path = import_path
            
            # Aggiungi l'estensione .js se mancante
            if not abs_path.endswith('.js'):
                abs_path += '.js'
                
            imports.append(abs_path)
    
    return imports


def process_file(file_path, processed_files, processing_stack, result_content):
    """
    Elabora ricorsivamente un file e le sue importazioni, gestendo le dipendenze circolari.
    
    Args:
        file_path (str): Percorso del file da elaborare
        processed_files (set): Set dei file già elaborati completamente
        processing_stack (set): Set dei file attualmente in fase di elaborazione
        result_content (list): Lista per raccogliere il contenuto elaborato
        
    Returns:
        bool: True se il file è stato elaborato con successo
    """
    if file_path in processed_files:
        return True
    
    # Controlla se il file è già in fase di elaborazione (dipendenza circolare)
    if file_path in processing_stack:
        print(f"Attenzione: Rilevata dipendenza circolare per {file_path}. Salto l'elaborazione ricorsiva.")
        return True
    
    if not os.path.exists(file_path):
        print(f"Attenzione: Il file {file_path} non esiste")
        return False
    
    print(f"Elaborazione del file: {file_path}")
    
    # Aggiunge il file allo stack di elaborazione
    processing_stack.add(file_path)
    
    # Lettura del contenuto del file
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Estrazione dei percorsi di import
    file_dir = os.path.dirname(file_path)
    imports = extract_imports(content, file_dir)
    
    # Elaborazione ricorsiva delle importazioni
    for import_path in imports:
        process_file(import_path, processed_files, processing_stack, result_content)
    
    # Rimuove le dichiarazioni import
    content = re.sub(r'import\s+(?:{[\s\S]*?}|\*\s+as\s+\w+|\w+)\s+from\s+["\'][^"\']+["\'];', '', content)
    content = re.sub(r'import\s+["\'][^"\']+["\'];', '', content)
    
    # Rimuove la parola chiave "export" preservando il resto della dichiarazione
    content = re.sub(r'(^|\s)export\s+(?=(?:const|let|var|function|class|default|async))', r'\1', content, flags=re.MULTILINE)
    content = re.sub(r'(^|\s)export\s+default\s+', r'\1', content, flags=re.MULTILINE)
    
    # Aggiunge un commento con il percorso del file
    result_content.append(f"\n// ---- File: {file_path} ----\n")
    result_content.append(content + "\n")
    
    # Rimuove il file dallo stack di elaborazione e lo segna come elaborato
    processing_stack.remove(file_path)
    processed_files.add(file_path)
    return True

def merge_js_files(entry_file, output_file):
    """
    Unisce tutti i file JS partendo da un file di ingresso e seguendo le importazioni.
    
    Args:
        entry_file (str): Il percorso del file di ingresso
        output_file (str): Il percorso del file di output
    """
    processed_files = set()
    processing_stack = set()  # Per rilevare le dipendenze circolari
    result_content = []
    
    # Elabora il file di ingresso e tutte le sue dipendenze
    process_file(entry_file, processed_files, processing_stack, result_content)
    
    # Scrive tutti i contenuti nel file di output
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(''.join(result_content))
    
    print(f"Unione completata! Il file di output è: {output_file}")
    print(f"Totale file elaborati: {len(processed_files)}")


if __name__ == "__main__":
    import sys
    
    input_dir = "src/"
    output_file = "allv86.js"

    if len(sys.argv) == 3:
        input_dir = sys.argv[1]
        output_file = sys.argv[2]        
    
    if not os.path.isdir(input_dir):
        print(f"Errore: '{input_dir}' non è una directory valida")
        sys.exit(1)
    
    merge_js_files("src/browser/main.js", "allv86.js")

    merge_js_files_normal("lib/", "libv86.js")