import os
import sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter

def overlay_promo_text(lang="en", output_path="scratch/promo_en_premium.png"):
    # 1. Base Image Path
    base_image_path = "/Users/grandmaestro/.gemini/antigravity/brain/4cda3594-ae4e-43d0-8ce6-3e99078c80cc/crypto_card_promo_1780687957360.png"
    if not os.path.exists(base_image_path):
        print(f"Error: Base image not found at {base_image_path}")
        return

    # Load 1024x1024 base image
    base_image = Image.open(base_image_path).convert("RGBA")
    width, height = base_image.size

    # Create overlay canvas
    overlay = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    # 2. Load Fonts
    font_bold_path = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
    font_reg_path = "/System/Library/Fonts/Supplemental/Arial.ttf"
    
    if not os.path.exists(font_bold_path):
        font_bold_path = "Arial"
    if not os.path.exists(font_reg_path):
        font_reg_path = "Arial"

    try:
        font_logo = ImageFont.truetype(font_bold_path, 40)
        font_tag = ImageFont.truetype(font_bold_path, 20)
        font_headline = ImageFont.truetype(font_bold_path, 52)
        font_large_num = ImageFont.truetype(font_bold_path, 150)
        font_subtext = ImageFont.truetype(font_reg_path, 32)
        font_footer = ImageFont.truetype(font_bold_path, 28)
    except Exception:
        font_logo = font_tag = font_headline = font_large_num = font_subtext = font_footer = ImageFont.load_default()

    # 3. Helper to draw text with a premium dark drop shadow (highly readable)
    def draw_text_with_shadow(draw_obj, pos, text, font, fill_color=(255, 255, 255, 255), shadow_color=(0, 0, 0, 200), offset=(2, 2)):
        x, y = pos
        # Draw shadow
        draw_obj.text((x + offset[0], y + offset[1]), text, fill=shadow_color, font=font)
        # Draw text
        draw_obj.text((x, y), text, fill=fill_color, font=font)

    # 4. Header: Pintopay Logo + Name
    logo_color = (255, 255, 255, 255)
    logo_points = [(60, 75), (80, 50), (100, 50), (80, 90), (60, 90)]
    draw.polygon(logo_points, fill=logo_color)
    draw.ellipse((80, 50, 100, 70), fill=logo_color)
    draw_text_with_shadow(draw, (115, 52), "Pintopay", font_logo)

    # 5. Header Tag: "JOIN THE NEW MONEY" / "ПРИСОЕДИНЯЙСЯ К НАМ"
    tag_text = "JOIN THE NEW MONEY" if lang == "en" else "ПРИСОЕДИНЯЙСЯ К НАМ"
    tag_padding_x = 22
    tag_padding_y = 10
    tag_x_right = width - 60
    
    tag_bbox = draw.textbbox((0, 0), tag_text, font=font_tag)
    tag_w = tag_bbox[2] - tag_bbox[0]
    tag_h = tag_bbox[3] - tag_bbox[1]
    
    tag_w_total = tag_w + tag_padding_x * 2 + 30
    tag_x_left = tag_x_right - tag_w_total
    tag_y_top = 50
    tag_y_bottom = tag_y_top + tag_h + tag_padding_y * 2

    # Draw capsule with glassmorphic transparent background
    draw.rounded_rectangle(
        (tag_x_left, tag_y_top, tag_x_right, tag_y_bottom),
        radius=20,
        fill=(0, 0, 0, 100),       # Translucent black backing
        outline=(255, 255, 255, 40), # Translucent border
        width=1
    )
    # Globe icon
    globe_x = tag_x_left + tag_padding_x + 5
    globe_y = tag_y_top + tag_padding_y + tag_h // 2 - 1
    draw.ellipse((globe_x - 7, globe_y - 7, globe_x + 7, globe_y + 7), outline=(255, 255, 255, 200), width=1)
    draw.line([(globe_x - 7, globe_y), (globe_x + 7, globe_y)], fill=(255, 255, 255, 160))
    draw.line([(globe_x, globe_y - 7), (globe_x, globe_y + 7)], fill=(255, 255, 255, 160))
    
    # Text inside capsule
    draw.text((tag_x_left + tag_padding_x + 18, tag_y_top + tag_padding_y - 2), tag_text, fill=(255, 255, 255, 230), font=font_tag)

    # 6. Headline: "The next shift is here."
    headline_text = "The next shift is here." if lang == "en" else "Новый тренд уже здесь."
    draw_text_with_shadow(draw, (60, 240), headline_text, font_headline)

    # 7. Large Stats Number: "+180%"
    num_text = "+180%"
    draw_text_with_shadow(draw, (60, 310), num_text, font_large_num, offset=(4, 4))

    # 8. Subtext Description
    if lang == "en":
        desc_line1 = "increase in crypto card payments over"
        desc_line2 = "the last 3 months. Earn up to 30%"
        desc_line3 = "of your community's card spends."
    else:
        desc_line1 = "рост платежей по криптокартам за"
        desc_line2 = "последние 3 месяца. Получайте до 30%"
        desc_line3 = "от расходов вашей команды по картам."

    draw_text_with_shadow(draw, (60, 580), desc_line1, font_subtext)
    draw_text_with_shadow(draw, (60, 630), desc_line2, font_subtext)
    draw_text_with_shadow(draw, (60, 680), desc_line3, font_subtext)

    # 9. Footer button: "@MyPintopay"
    footer_text = "@MyPintopay"
    footer_bbox = draw.textbbox((0, 0), footer_text, font=font_footer)
    footer_w = footer_bbox[2] - footer_bbox[0]
    footer_h = footer_bbox[3] - footer_bbox[1]

    footer_padding_x = 35
    footer_padding_y = 12
    footer_w_total = footer_w + footer_padding_x * 2 + 30
    footer_x_left = (width - footer_w_total) // 2
    footer_y_top = 840
    footer_y_bottom = footer_y_top + footer_h + footer_padding_y * 2

    # Draw translucent button
    draw.rounded_rectangle(
        (footer_x_left, footer_y_top, footer_x_left + footer_w_total, footer_y_bottom),
        radius=25,
        fill=(0, 0, 0, 140), # Solid black translucent backing
        outline=(255, 255, 255, 50),
        width=1
    )
    
    # Plane icon
    plane_x = footer_x_left + footer_padding_x
    plane_y = footer_y_top + footer_padding_y + footer_h // 2
    plane_points = [
        (plane_x - 10, plane_y - 8),
        (plane_x + 10, plane_y - 2),
        (plane_x - 3, plane_y + 8),
        (plane_x - 3, plane_y + 2),
        (plane_x - 10, plane_y - 8)
    ]
    draw.polygon(plane_points, fill=(255, 255, 255, 220))
    draw.line([(plane_x - 3, plane_y + 2), (plane_x + 10, plane_y - 2)], fill=(255, 255, 255, 220), width=1)
    
    # Text inside footer button
    draw.text((footer_x_left + footer_padding_x + 26, footer_y_top + footer_padding_y - 2), footer_text, fill=(255, 255, 255, 240), font=font_footer)

    # 10. Composite and Save
    final_image = Image.alpha_composite(base_image, overlay)
    final_image.convert("RGB").save(output_path, "PNG")
    print(f"✨ Successfully generated premium overlay image: {output_path} ({lang.upper()})")

if __name__ == "__main__":
    os.makedirs("scratch", exist_ok=True)
    overlay_promo_text("en", "scratch/promo_en.png")
    overlay_promo_text("ru", "scratch/promo_ru.png")
