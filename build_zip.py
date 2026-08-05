import zipfile
import os

def build_zip():
    dist_dir = 'dist'
    zip_targets = ['public/dist.zip', 'public/rinjani-infinityfree.zip']
    allowed_root_files = {'index.html', '.htaccess', 'db.php', 'api.php', 'database.sql'}
    
    for target in zip_targets:
        os.makedirs(os.path.dirname(target), exist_ok=True)
        if os.path.exists(target):
            try:
                os.remove(target)
            except Exception:
                pass
            
        with zipfile.ZipFile(target, 'w', compression=zipfile.ZIP_DEFLATED) as ziph:
            for root, dirs, files in os.walk(dist_dir):
                for file in files:
                    rel_path = os.path.relpath(os.path.join(root, file), dist_dir)
                    
                    # Exclude zip files, node server files, maps
                    if file.endswith('.zip') or file.startswith('server.cjs'):
                        continue
                        
                    # Include allowed root files and assets folder
                    if rel_path in allowed_root_files or rel_path.startswith('assets/'):
                        filepath = os.path.join(root, file)
                        if rel_path == 'index.html':
                            with open(filepath, 'r', encoding='utf-8') as f:
                                html_content = f.read()
                            # Clean up crossorigin attribute for InfinityFree compatibility
                            clean_html = html_content.replace('crossorigin ', '').replace(' crossorigin', '')
                            ziph.writestr('index.html', clean_html)
                        else:
                            ziph.write(filepath, rel_path)
        
        print(f"Successfully created valid clean zip: {target}")

if __name__ == '__main__':
    build_zip()


