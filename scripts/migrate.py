import os
import shutil
from pathlib import Path
import json

# 项目根目录
ROOT_DIR = Path(__file__).parent.parent
SOURCE_DIR = ROOT_DIR / 'threejs-demo'
TARGET_DIR = ROOT_DIR / 'src' / 'demos'

def get_demo_dirs():
    """获取所有demo目录"""
    if not SOURCE_DIR.exists():
        return []
    return [d for d in SOURCE_DIR.iterdir() if d.is_dir() and not d.name.startswith('.')]

def scan_existing_demos():
    """扫描现有的demos目录"""
    if not TARGET_DIR.exists():
        return []
    # 确保目录是demo目录（包含src子目录和index.html）
    return [d.name for d in TARGET_DIR.iterdir() 
            if d.is_dir() 
            and not d.name.startswith('.') 
            and (d / 'src').exists() 
            and (d / 'index.html').exists()]

def migrate_demo(src_path: Path):
    """迁移单个demo"""
    # 使用原始文件夹名作为目标名称
    target_name = src_path.name
    target_path = TARGET_DIR / target_name
    
    print(f"Migrating {target_name}...")
    
    # 创建目标目录结构
    os.makedirs(target_path / 'src', exist_ok=True)
    os.makedirs(target_path / 'public', exist_ok=True)
    
    try:
        # 创建index.html文件
        index_html_content = '''<!DOCTYPE html>
<html lang="zh">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Three.js Demo</title>
    <style>
        body { margin: 0; }
        #canvas {
            width: 100vw;
            height: 100vh;
            display: block;
        }
    </style>
</head>
<body>
    
    <script type="module" src="./src/index.js"></script>
</body>
</html>'''
        
        with open(target_path / 'index.html', 'w', encoding='utf-8') as f:
            f.write(index_html_content)
            
        # 复制源代码文件
        src_files = list((src_path / 'src').glob('*.*'))
        for src_file in src_files:
            # 如果是main.js，重命名为index.js
            target_file = target_path / 'src' / ('index.js' if src_file.name == 'main.js' else src_file.name)
            shutil.copy2(src_file, target_file)
            
        # 复制资源文件
        src_assets = src_path / 'public'
        if src_assets.exists():
            for item in src_assets.iterdir():
                if item.is_file():
                    shutil.copy2(item, target_path / 'public')
                elif item.is_dir():
                    shutil.copytree(item, target_path / 'public' / item.name, dirs_exist_ok=True)
        
        # 复制其他资源文件夹(如assets, textures等)
        for dir_name in ['assets', 'textures', 'models', 'images']:
            src_dir = src_path / dir_name
            if src_dir.exists():
                shutil.copytree(src_dir, target_path / 'public' / dir_name, dirs_exist_ok=True)
                
        print(f"Successfully migrated {target_name}")
        return target_name
        
    except Exception as e:
        print(f"Error migrating {target_name}: {str(e)}")
        return None

def generate_example_entry(demo_name: str) -> dict:
    """生成案例配置项"""
    return {
        "id": demo_name,
        "title": demo_name.replace('-', ' ').title(),
        "description": f"Three.js {demo_name.replace('-', ' ')} demo",
        "thumbnail": f"/src/demos/{demo_name}/public/thumbnail.jpg",
        "tags": ["demo"]
    }

def generate_demos_config():
    """生成完整的demos配置文件"""
    demos = scan_existing_demos()
    config = []
    print(f"正在扫描demos目录，找到以下demo：")
    for demo in sorted(demos):  # 按字母顺序排序
        print(f"- {demo}")
        config.append(generate_example_entry(demo))
    
    # 将配置写入到demos目录下
    config_path = TARGET_DIR / 'config.json'
    with open(config_path, 'w', encoding='utf-8') as f:
        json.dump(config, f, indent=2, ensure_ascii=False)
    
    return config

def main():
    # 确保目标目录存在
    os.makedirs(TARGET_DIR, exist_ok=True)
    
    # 获取并迁移所有demo
    demo_dirs = get_demo_dirs()
    migrated_demos = []
    
    for demo_dir in demo_dirs:
        result = migrate_demo(demo_dir)
        if result:
            migrated_demos.append(result)
    
    print(f"\nMigrated {len(migrated_demos)} demos")
    print("Please update src/demos/index.js with the following entries:")
    
    # 打印新案例的配置信息
    for demo in migrated_demos:
        print(f"\n{generate_example_entry(demo)},")
    
    # 生成完整的demos配置
    print("\n正在生成完整的demos配置...")
    demos_config = generate_demos_config()
    print(f"找到 {len(demos_config)} 个demo")
    print("demos配置已更新到 src/demos/config.json")
    
    # 打印新案例的配置信息
    for demo in migrated_demos:
        print(f"\n新增案例: {generate_example_entry(demo)},")

if __name__ == '__main__':
    main()
