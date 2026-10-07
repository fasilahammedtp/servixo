import os
from PIL import Image, ImageDraw

def create_wrench_svg():
    return '''<svg viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#1B3B34" />
      <stop offset="100%" stopColor="#0E1E1B" />
    </linearGradient>
    <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#F6D389" />
      <stop offset="50%" stopColor="#E5B25D" />
      <stop offset="100%" stopColor="#C8933B" />
    </linearGradient>
  </defs>

  <!-- Background Card -->
  <rect width="512" height="512" rx="112" fill="url(#bg-grad)" />

  <!-- Inset Border -->
  <rect x="16" y="16" width="480" height="480" rx="96" fill="none" stroke="url(#gold-grad)" strokeWidth="4" opacity="0.3" />

  <!-- Single Clean Wrench angled diagonally -->
  <g transform="translate(256, 256) rotate(-45) translate(-256, -256)">
    <!-- Handle -->
    <rect x="234" y="150" width="44" height="212" rx="18" fill="url(#gold-grad)" />

    <!-- Top Open-End Jaw Head -->
    <path d="M 256 90 
             C 292 90, 320 118, 320 154 
             C 320 175, 309 193, 293 204 
             L 219 204 
             C 203 193, 192 175, 192 154 
             C 192 118, 220 90, 256 90 Z" 
          fill="url(#gold-grad)" />
    
    <!-- Open Jaw Cutout -->
    <path d="M 234 85 
             L 278 85 
             L 278 140 
             C 278 152, 268 162, 256 162 
             C 244 162, 234 152, 234 140 Z" 
          fill="#162E28" />

    <!-- Bottom Ring Head -->
    <circle cx="256" cy="362" r="54" fill="url(#gold-grad)" />
    <circle cx="256" cy="362" r="26" fill="#142823" />
  </g>
</svg>'''

def draw_master_wrench_pil(master_size=1024):
    img = Image.new("RGBA", (master_size, master_size), (0, 0, 0, 0))
    s = master_size / 512.0

    bg_color = (27, 59, 52, 255) # #1B3B34
    gold_color = (229, 178, 93, 255) # #E5B25D
    border_color = (229, 178, 93, 76) # opacity 0.3
    dark_inner = (22, 46, 40, 255) # #162E28

    draw = ImageDraw.Draw(img)

    # Background rounded rect
    rx = int(112 * s)
    draw.rounded_rectangle([0, 0, master_size - 1, master_size - 1], radius=rx, fill=bg_color)

    # Inset border
    inset = int(16 * s)
    border_rx = int(96 * s)
    stroke_w = int(4 * s)
    draw.rounded_rectangle([inset, inset, master_size - 1 - inset, master_size - 1 - inset], radius=border_rx, outline=border_color, width=stroke_w)

    # Draw upright wrench on transparent canvas
    u_img = Image.new("RGBA", (master_size, master_size), (0, 0, 0, 0))
    u_draw = ImageDraw.Draw(u_img)

    # Handle
    u_draw.rounded_rectangle(
        [int(234 * s), int(150 * s), int(278 * s), int(362 * s)],
        radius=int(18 * s),
        fill=gold_color
    )

    # Top Head Circle
    u_draw.ellipse(
        [int(192 * s), int(90 * s), int(320 * s), int(218 * s)],
        fill=gold_color
    )

    # Jaw Cutout (U-shaped notch)
    notch_polygon = [
        (int(234 * s), int(80 * s)),
        (int(278 * s), int(80 * s)),
        (int(278 * s), int(140 * s)),
        (int(234 * s), int(140 * s))
    ]
    u_draw.polygon(notch_polygon, fill=(0, 0, 0, 0))
    u_draw.ellipse(
        [int(234 * s), int(118 * s), int(278 * s), int(162 * s)],
        fill=(0, 0, 0, 0)
    )

    # Bottom Ring Head
    u_draw.ellipse(
        [int(202 * s), int(308 * s), int(310 * s), int(416 * s)],
        fill=gold_color
    )
    # Ring Hole
    u_draw.ellipse(
        [int(230 * s), int(336 * s), int(282 * s), int(388 * s)],
        fill=bg_color
    )

    # Rotate wrench by -45 degrees around center
    cx, cy = master_size / 2.0, master_size / 2.0
    rotated_wrench = u_img.rotate(-45, resample=Image.BICUBIC, center=(cx, cy))

    # Composite rotated wrench onto main image
    img.paste(rotated_wrench, (0, 0), rotated_wrench)
    return img

def main():
    public_dir = "/home/fasil-tp/Downloads/servixo/servixo-frontend/public"

    # 1. Write favicon.svg
    svg_data = create_wrench_svg()
    with open(os.path.join(public_dir, "favicon.svg"), "w") as f:
        f.write(svg_data)
    print("✓ Created favicon.svg")

    # 2. Draw 1024x1024 master image
    master_img = draw_master_wrench_pil(1024)

    # 3. Generate PNG sizes
    sizes = {
        "icon-512x512.png": 512,
        "apple-touch-icon.png": 180,
        "favicon-48x48.png": 48,
        "favicon-32x32.png": 32,
        "favicon-16x16.png": 16,
    }

    images_for_ico = []

    for filename, sz in sizes.items():
        resized = master_img.resize((sz, sz), Image.Resampling.LANCZOS)
        out_path = os.path.join(public_dir, filename)
        resized.save(out_path, format="PNG")
        print(f"✓ Created {filename} ({sz}x{sz})")
        if sz in [16, 32, 48]:
            images_for_ico.append(resized)

    # 4. Generate favicon.ico (multi-resolution ICO file)
    ico_path = os.path.join(public_dir, "favicon.ico")
    images_for_ico[0].save(
        ico_path,
        format="ICO",
        sizes=[(im.width, im.height) for im in images_for_ico],
        append_images=images_for_ico[1:]
    )
    print("✓ Created favicon.ico")

if __name__ == "__main__":
    main()
