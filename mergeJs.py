import os
import re

def merge_js_files(directory, output_file):
    """
    Unisce tutti i file JS in una directory e nelle sue sottodirectory,
    ignorando le linee di import.
    
    Args:
        directory (str): Il percorso della directory da scansionare
        output_file (str): Il percorso del file di output
    """
    # Espressione regolare per identificare le linee di import
    import_pattern = re.compile(r'^\s*import\s+.+|^\s*export\s+.+')
    
    # Lista per salvare i contenuti dei file
    js_contents = []
    
    # Percorre ricorsivamente la directory
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith('.js'):
                file_path = os.path.join(root, file)
                print(f"Elaborazione del file: {file_path}")
                
                # Legge il file ignorando le linee di import
                with open(file_path, 'r', encoding='utf-8') as f:
                    lines = f.readlines()
                    # Filtra le linee di import
                    filtered_lines = [line for line in lines if not import_pattern.match(line)]
                    
                    # Aggiunge il contenuto filtrato alla lista
                    js_contents.append(f"\n// ---- File: {file_path} ----\n")
                    js_contents.append(''.join(filtered_lines))
    
    # Scrive tutti i contenuti nel file di output
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(''.join(js_contents))
    
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