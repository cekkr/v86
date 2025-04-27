import os
import sys
import json
from esprima import parseScript, parseModule
import escodegen

import os
import re

def merge_js_files(directory, output_file):
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
    
    merge_js_files(input_dir, output_file)