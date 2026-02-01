import { GoogleGenAI, Type } from "@google/genai";

// Model mặc định
const DEFAULT_MODEL = 'gemini-3-pro-preview';

// Danh sách models theo thứ tự fallback (khi model hiện tại gặp lỗi/quá tải)
const FALLBACK_MODELS = [
  'gemini-3-flash-preview',
  'gemini-3-pro-preview',
  'gemini-2.5-flash'
];

// Storage keys
const STORAGE_KEYS = {
  API_KEY: 'library_api_key',
  MODEL: 'library_ai_model'
};

// Helper để lấy API key từ localStorage
export const getStoredApiKey = (): string | null => {
  return localStorage.getItem(STORAGE_KEYS.API_KEY);
};

// Helper để lưu API key
export const saveApiKey = (key: string): void => {
  localStorage.setItem(STORAGE_KEYS.API_KEY, key);
};

// Helper để lấy model đã chọn
export const getStoredModel = (): string => {
  return localStorage.getItem(STORAGE_KEYS.MODEL) || DEFAULT_MODEL;
};

// Helper để lưu model
export const saveModel = (model: string): void => {
  localStorage.setItem(STORAGE_KEYS.MODEL, model);
};

// Helper để xóa cấu hình
export const clearApiConfig = (): void => {
  localStorage.removeItem(STORAGE_KEYS.API_KEY);
  localStorage.removeItem(STORAGE_KEYS.MODEL);
};

// Gọi AI với cơ chế fallback
async function callWithFallback<T>(
  apiKey: string,
  preferredModel: string,
  prompt: string,
  responseSchema: any
): Promise<{ result: T; usedModel: string }> {
  // Sắp xếp lại models với preferred model đầu tiên
  const models = [preferredModel, ...FALLBACK_MODELS.filter(m => m !== preferredModel)];

  let lastError: Error | null = null;

  for (const model of models) {
    try {
      const ai = new GoogleGenAI({ apiKey });

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema
        }
      });

      const result = JSON.parse(response.text || "{}");
      return { result, usedModel: model };
    } catch (error: any) {
      console.warn(`Model ${model} failed:`, error.message);
      lastError = error;

      // Nếu là lỗi API key không hợp lệ, không cần thử model khác
      if (error.message?.includes('API_KEY_INVALID') ||
        error.message?.includes('invalid api key')) {
        throw new Error('API Key không hợp lệ. Vui lòng kiểm tra lại.');
      }

      // Tiếp tục thử model tiếp theo
      continue;
    }
  }

  // Tất cả models đều thất bại
  throw lastError || new Error('Tất cả models đều thất bại');
}

// Interface cho kết quả gợi ý sách
export interface BookRecommendation {
  title: string;
  author: string;
  reason: string;
  category: string;
}

export interface RecommendationsResult {
  recommendations: BookRecommendation[];
  error?: string;
  usedModel?: string;
}

export const getBookRecommendations = async (
  query: string,
  currentBooks: string[]
): Promise<RecommendationsResult> => {
  try {
    const apiKey = getStoredApiKey();
    if (!apiKey) {
      return {
        recommendations: [],
        error: 'Chưa cấu hình API Key. Vui lòng vào Cài đặt để nhập API key.'
      };
    }

    const preferredModel = getStoredModel();

    const prompt = `
      Bạn là một thủ thư trường THPT thông thái.
      Người dùng đang tìm sách với từ khóa hoặc chủ đề: "${query}".
      
      Hãy gợi ý 3-5 cuốn sách phù hợp với lứa tuổi học sinh cấp 3 (15-18 tuổi).
      Ưu tiên các sách có giá trị giáo dục, kỹ năng sống hoặc hỗ trợ học tập.
      
      Danh sách sách hiện có trong thư viện (để tham khảo, nhưng hãy gợi ý cả sách mới nếu hay):
      ${currentBooks.join(', ')}

      Trả về kết quả dưới dạng JSON thuần túy.
    `;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        recommendations: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              author: { type: Type.STRING },
              reason: { type: Type.STRING, description: "Lý do ngắn gọn tại sao nên đọc" },
              category: { type: Type.STRING }
            }
          }
        }
      }
    };

    const { result, usedModel } = await callWithFallback<{ recommendations: BookRecommendation[] }>(
      apiKey,
      preferredModel,
      prompt,
      responseSchema
    );

    return {
      recommendations: result.recommendations || [],
      usedModel
    };
  } catch (error: any) {
    console.error("Gemini Error:", error);

    // Trả về lỗi chi tiết
    let errorMessage = 'Đã xảy ra lỗi khi gọi AI.';

    if (error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED')) {
      errorMessage = '429 RESOURCE_EXHAUSTED: Đã hết quota API. Vui lòng đợi hoặc đổi API key.';
    } else if (error.message?.includes('API Key')) {
      errorMessage = error.message;
    } else if (error.message) {
      errorMessage = `Lỗi: ${error.message}`;
    }

    return {
      recommendations: [],
      error: errorMessage
    };
  }
};

// Interface cho sách được trích xuất từ file
export interface ExtractedBook {
  title: string;
  author: string;
  category: string;
  quantity: number;
}

export interface ExtractBooksResult {
  books: ExtractedBook[];
  error?: string;
  usedModel?: string;
}

// Trích xuất danh sách sách từ nội dung text
export const extractBooksFromText = async (
  content: string,
  isTableData: boolean = false
): Promise<ExtractBooksResult> => {
  try {
    const apiKey = getStoredApiKey();
    if (!apiKey) {
      return {
        books: [],
        error: 'Chưa cấu hình API Key. Vui lòng vào Cài đặt để nhập API key.'
      };
    }

    const preferredModel = getStoredModel();

    const prompt = `
      Bạn là một thủ thư chuyên nghiệp. Hãy phân tích nội dung sau và trích xuất danh sách sách.
      
      ${isTableData ? 'Đây là dữ liệu từ file Excel, các cột được phân cách bởi "|".' : 'Đây là nội dung văn bản từ file Word/PDF.'}
      
      NỘI DUNG:
      """
      ${content.substring(0, 8000)}
      """
      
      Hãy trích xuất tất cả các sách có trong nội dung trên. Với mỗi cuốn sách, xác định:
      1. title (tên sách) - BẮT BUỘC
      2. author (tác giả) - nếu không rõ, để "Chưa rõ"
      3. category (thể loại) - phải là một trong: "Văn học", "Khoa học", "Lịch sử - Địa lý", "Tiếng Anh", "Kỹ năng sống", "Tham khảo", "Kiến thức chung"
      4. quantity (số lượng) - nếu không rõ, để 1
      
      Chỉ trả về JSON, không giải thích thêm.
    `;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        books: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              author: { type: Type.STRING },
              category: { type: Type.STRING },
              quantity: { type: Type.NUMBER }
            }
          }
        }
      }
    };

    const { result, usedModel } = await callWithFallback<{ books: ExtractedBook[] }>(
      apiKey,
      preferredModel,
      prompt,
      responseSchema
    );

    return {
      books: result.books || [],
      usedModel
    };
  } catch (error: any) {
    console.error("Extract Books Error:", error);

    let errorMessage = 'Đã xảy ra lỗi khi phân tích file.';

    if (error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED')) {
      errorMessage = '429 RESOURCE_EXHAUSTED: Đã hết quota API. Vui lòng đợi hoặc đổi API key.';
    } else if (error.message?.includes('API Key')) {
      errorMessage = error.message;
    } else if (error.message) {
      errorMessage = `Lỗi: ${error.message}`;
    }

    return {
      books: [],
      error: errorMessage
    };
  }
};