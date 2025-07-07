export class VietnameseNormalizer {
  private static vietnameseAccents: { [key: string]: string } = {
    'à': 'a', 'á': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
    'ằ': 'a', 'ắ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a',
    'ầ': 'a', 'ấ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ậ': 'a',
    'è': 'e', 'é': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e',
    'ề': 'e', 'ế': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e',
    'ì': 'i', 'í': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
    'ò': 'o', 'ó': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o',
    'ồ': 'o', 'ố': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o',
    'ờ': 'o', 'ớ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o',
    'ù': 'u', 'ú': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u',
    'ừ': 'u', 'ứ': 'u', 'ử': 'u', 'ữ': 'u', 'ự': 'u',
    'ỳ': 'y', 'ý': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y',
    'đ': 'd', 'Đ': 'D',
    'À': 'A', 'Á': 'A', 'Ả': 'A', 'Ã': 'A', 'Ạ': 'A',
    'Ằ': 'A', 'Ắ': 'A', 'Ẳ': 'A', 'Ẵ': 'A', 'Ặ': 'A',
    'Ầ': 'A', 'Ấ': 'A', 'Ẩ': 'A', 'Ẫ': 'A', 'Ậ': 'A',
    'È': 'E', 'É': 'E', 'Ẻ': 'E', 'Ẽ': 'E', 'Ẹ': 'E',
    'Ề': 'E', 'Ế': 'E', 'Ể': 'E', 'Ễ': 'E', 'Ệ': 'E',
    'Ì': 'I', 'Í': 'I', 'Ỉ': 'I', 'Ĩ': 'I', 'Ị': 'I',
    'Ò': 'O', 'Ó': 'O', 'Ỏ': 'O', 'Õ': 'O', 'Ọ': 'O',
    'Ồ': 'O', 'Ố': 'O', 'Ổ': 'O', 'Ỗ': 'O', 'Ộ': 'O',
    'Ờ': 'O', 'Ớ': 'O', 'Ở': 'O', 'Ỡ': 'O', 'Ợ': 'O',
    'Ù': 'U', 'Ú': 'U', 'Ủ': 'U', 'Ũ': 'U', 'Ụ': 'U',
    'Ừ': 'U', 'Ứ': 'U', 'Ử': 'U', 'Ữ': 'U', 'Ự': 'U',
    'Ỳ': 'Y', 'Ý': 'Y', 'Ỷ': 'Y', 'Ỹ': 'Y', 'Ỵ': 'Y'
  };

  static removeAccents(text: string): string {
    return text.replace(/[àáảãạằắẳẵặầấẩẫậèéẻẽẹềếểễệìíỉĩịòóỏõọồốổỗộờớởỡợùúủũụừứửữựỳýỷỹỵđÀÁẢÃẠẰẮẲẴẶẦẤẨẪẬÈÉẺẼẸỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌỒỐỔỖỘỜỚỞỠỢÙÚỦŨỤỪỨỬỮỰỲÝỶỸỴĐ]/g, (match) => {
      return this.vietnameseAccents[match] || match;
    });
  }

  static normalizeForFilename(fullName: string): string {
    // Remove accents
    let normalized = this.removeAccents(fullName);
    
    // Convert to lowercase
    normalized = normalized.toLowerCase();
    
    // Replace spaces with underscores
    normalized = normalized.replace(/\s+/g, '_');
    
    // Remove special characters except underscores
    normalized = normalized.replace(/[^a-z0-9_]/g, '');
    
    // Remove multiple consecutive underscores
    normalized = normalized.replace(/_+/g, '_');
    
    // Remove leading/trailing underscores
    normalized = normalized.replace(/^_+|_+$/g, '');
    
    return normalized;
  }

  static extractNameAndCode(text: string): { fullName: string; code: string } | null {
    // Flexible patterns for "Họ và tên" and "Code"
    const namePatterns = [
      /(?:họ\s*và\s*tên|ho\s*va\s*ten)\s*[:\-]?\s*([^\n\r]+)/gi,
      /(?:tên|ten)\s*[:\-]?\s*([^\n\r]+)/gi,
      /(?:full\s*name|fullname)\s*[:\-]?\s*([^\n\r]+)/gi
    ];

    const codePatterns = [
      /(?:code|mã\s*số|ma\s*so)\s*[:\-]?\s*([^\s\n\r]+)/gi,
      /(?:id|số\s*thứ\s*tự|so\s*thu\s*tu)\s*[:\-]?\s*([^\s\n\r]+)/gi
    ];

    let fullName = '';
    let code = '';

    // Extract name
    for (const pattern of namePatterns) {
      const match = pattern.exec(text);
      if (match && match[1]) {
        fullName = match[1].trim();
        break;
      }
    }

    // Extract code
    for (const pattern of codePatterns) {
      const match = pattern.exec(text);
      if (match && match[1]) {
        code = match[1].trim();
        break;
      }
    }

    if (fullName && code) {
      return { fullName, code };
    }

    return null;
  }

  static generateFilename(code: string, fullName: string, format: 'docx' | 'pdf'): string {
    const normalizedName = this.normalizeForFilename(fullName);
    const cleanCode = code.replace(/[^a-zA-Z0-9]/g, '');
    return `${cleanCode}_${normalizedName}.${format}`;
  }
}
