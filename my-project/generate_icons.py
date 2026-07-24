from PIL import Image, ImageDraw, ImageFont
import os

# 图标目录
icon_dir = "src/static/tab"
os.makedirs(icon_dir, exist_ok=True)

# 图标配置：(文件名, 文字, 颜色)
icons = [
    ("home.png", "H", "#7A7A7A"),           # 首页（未选中）
    ("home-active.png", "H", "#1F3A5F"),    # 首页（选中）
    ("learn.png", "L", "#7A7A7A"),          # 学习中心（未选中）
    ("learn-active.png", "L", "#1F3A5F"),   # 学习中心（选中）
    ("speak.png", "S", "#7A7A7A"),          # 口语练习（未选中）
    ("speak-active.png", "S", "#1F3A5F"),   # 口语练习（选中）
    ("mine.png", "M", "#7A7A7A"),           # 我的（未选中）
    ("mine-active.png", "M", "#1F3A5F"),    # 我的（选中）
]

def hex_to_rgb(hex_color):
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def create_icon(filename, text, color_hex):
    # 创建81x81像素的图标（微信推荐尺寸）
    size = 81
    img = Image.new('RGBA', (size, size), (255, 255, 255, 0))
    draw = ImageDraw.Draw(img)
    
    # 绘制圆形背景
    color = hex_to_rgb(color_hex)
    margin = 10
    draw.ellipse([margin, margin, size-margin, size-margin], fill=color + (255,))
    
    # 绘制文字
    try:
        font = ImageFont.truetype("arial.ttf", 30)
    except:
        font = ImageFont.load_default()
    
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    x = (size - text_width) // 2
    y = (size - text_height) // 2 - 5
    draw.text((x, y), text, fill=(255, 255, 255, 255), font=font)
    
    # 保存
    filepath = os.path.join(icon_dir, filename)
    img.save(filepath, 'PNG')
    print(f"Created: {filepath}")

# 生成所有图标
for filename, text, color in icons:
    create_icon(filename, text, color)

print("\nAll icons generated successfully!")
