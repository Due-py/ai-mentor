import { GoogleGenAI } from "@google/genai";
import { UserMemory, StudyPlan, Resource, Question } from '../types';
import { retrieveRelevantChunks } from './localEmbeddingService';


const getClient = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("VITE_GEMINI_API_KEY is not set in environment variables");
  }
  return new GoogleGenAI({ apiKey });
};

// --- Helper: Clean JSON ---
const cleanAndParseJSON = (text: string) => {
  try {
    // Remove Markdown code blocks
    let cleaned = text.replace(/```json/g, '').replace(/```/g, '');
    
    // Find valid JSON bounds
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    const firstBracket = cleaned.indexOf('[');
    const lastBracket = cleaned.lastIndexOf(']');

    // Determine if we are looking for object or array
    if (firstBrace !== -1 && lastBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    } else if (firstBracket !== -1 && lastBracket !== -1) {
      cleaned = cleaned.substring(firstBracket, lastBracket + 1);
    }
    
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("JSON Parse Error", e);
    return null;
  }
};

// --- Context Injection ---
const constructSystemInstruction = (memory: UserMemory, contextType: string) => {
  return `
    Bạn là AI Mentor, một trợ lý học tập AI thông minh, điềm tĩnh và chuyên nghiệp.
    
    THÔNG TIN NGƯỜI DÙNG:
    Tên: ${memory.name}
    Lớp: ${memory.grade} (Hệ thống giáo dục Việt Nam)
    
    VAI TRÒ CỦA BẠN:
    Hiện tại bạn đang đóng vai trò: ${contextType}.
    
    NGUYÊN TẮC:
    1. Ngôn ngữ: 100% Tiếng Việt.
    2. Nội dung: Chính xác, phù hợp giáo dục Việt Nam.
    
    3. CÔNG THỨC TOÁN - RẤT QUAN TRỌNG:
       Khi có công thức toán, bắt buộc viết dúng Markdown LaTeX:
       - Công thức inline (trong dòng): $công_thức$
         Ví dụ: Công thức $x^2 + 2x + 1$ là bình phương của $(x+1)$.
       - Công thức riêng dòng (block): $$công_thức$$
         Ví dụ:
         $$x^2 + 2x + 1 = (x+1)^2$$
         $$\frac{a}{b} = \frac{c}{d}$$
       
       LUẬT CỨNG:
       - KHÔNG escape ký tự $. Viết $...$ mà không cần \$ hay $ ...$ .
       - Các công thức phức tạp nên dùng block ($$...$$) để dễ đọc.
       - Luôn format lại công thức đã cho từ người dùng thành LaTeX chuẩn nếu chưa có.
       - Nếu giải thích công thức, viết công thức trước, rồi giải thích sau.
    
    4. ƯTIÊN SỬ DỤNG TOÁN:
       Khi trả lời câu hỏi liên quan tới toán, hãy:
       - Viết công thức toán rõ ràng
       - Giải thích từng bước
       - Cho ví dụ cụ thể
  `;
};

// --- Feature: Quiz Generation ---
export const generateQuizForTask = async (taskDescription: string, memory: UserMemory): Promise<Question | null> => {
  const ai = getClient();
  const prompt = `
    Dựa trên nhiệm vụ học tập: "${taskDescription}".
    Hãy tạo 1 câu hỏi trắc nghiệm (Multiple Choice) để kiểm tra xem học sinh đã hiểu bài chưa.
    Trình độ: ${memory.grade}.
    
    LƯU Ý QUAN TRỌNG:
    - Nếu câu hỏi hay đáp án có công thức toán, BẮTBUỘC dùng LaTeX: $...$ (inline) hoặc $$...$$ (block).
    - Không escape ký tự $.
    - Giải thích phải rõ ràng và chi tiết.
    
    Trả về JSON duy nhất (không markdown):
    {
      "id": "q1",
      "text": "Nội dung câu hỏi? (dùng LaTeX nếu có công thức)",
      "options": ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
      "correctAnswer": 0,
      "explanation": "Giải thích ngắn gọn tại sao đáp án này đúng. (dùng LaTeX nếu cần)"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        systemInstruction: constructSystemInstruction(memory, 'Giáo viên Kiểm tra'),
      }
    });

    const text = response.text || '';
    return cleanAndParseJSON(text) as Question;
  } catch (error) {
    console.error("Quiz Gen Error:", error);
    return null;
  }
};

// --- Feature: Study Plan Generator ---
export const generateStudyPlan = async (subject: string, duration: string, memory: UserMemory): Promise<StudyPlan | null> => {
  const ai = getClient();
  const prompt = `
    Lập lộ trình học tập chi tiết cho môn "${subject}" trong thời gian "${duration}".
    Học sinh đang học ${memory.grade}.
    Các phần kiến thức học sinh còn yếu: ${memory.weaknesses.join(', ')}.
    
    Yêu cầu:
    - Bám sát chương trình ${memory.grade} của Việt Nam.
    - Chia nhỏ nhiệm vụ cụ thể.
    
    Trả về định dạng JSON CHÍNH XÁC theo mẫu sau (không thêm markdown code block, không thêm lời dẫn):
    {
      "subject": "${subject}",
      "duration": "${duration}",
      "weeks": [
        {
          "week": 1,
          "days": [
            {
              "day": 1,
              "tasks": [
                { "id": "t1", "description": "Tên nhiệm vụ cụ thể (VD: Ôn tập chương 1 SGK)", "completed": false }
              ]
            }
          ]
        }
      ]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        systemInstruction: constructSystemInstruction(memory, 'Chuyên gia Lập kế hoạch Giáo dục'),
      }
    });

    const text = response.text || '';
    return cleanAndParseJSON(text) as StudyPlan;
  } catch (error) {
    console.error("Gemini Plan Error:", error);
    return null;
  }
};

// --- Helper: Validate URL ---
const isValidUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};

// --- Feature: Resource Discovery ---
export const discoverResources = async (subject: string, memory: UserMemory): Promise<Resource[]> => {
  const ai = getClient();
  const prompt = `
    Tìm 5 tài liệu học tập trực tuyến chất lượng cao, miễn phí cho môn "${subject}" trình độ ${memory.grade} tại Việt Nam.
    
    HƯỚNG DẪN QUAN TRỌNG:
    - CHỈ sử dụng các trang web/nguồn uy tín được tạo thành công: VietJack, Hocmai, OLM, Vuihoc, Khan Academy Tiếng Việt, FPT Skool.
    - URL PHẢI CHÍNH XÁC 100% và hiện tại hoạt động (không hallucinate URL).
    - Ưu tiên các bài viết/video từ:
      * VietJack (vietjack.com)
      * Hocmai (hocmai.vn)
      * OLM (olm.vn)
      * Vuihoc (vuihoc.vn)
    - Nếu không chắc URL chính xác, thay vì hallucinate, hãy mô tả rõ tên bài viết và để url = "https://vietjack.com" (domain chính).
    
    Trả về JSON (không markdown):
    [
      {
        "id": "unique_id",
        "title": "Tên tài liệu (ví dụ: Bài tập về Từ loại - Tiếng Anh)",
        "type": "video" | "article" | "exercise",
        "url": "https://vietjack.com/trang-chu",
        "authority": "High",
        "description": "Mô tả ngắn gọn về nội dung."
      }
    ]
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        systemInstruction: constructSystemInstruction(memory, 'Thủ thư Học thuật'),
      }
    });

    const text = response.text || '';
    const resources = cleanAndParseJSON(text) || [];
    
    // Filter out invalid URLs
    return resources.filter((resource: Resource) => isValidUrl(resource.url));
  } catch (error) {
    console.error("Resource Discovery Error:", error);
    return [];
  }
};

// --- Feature: Scriba (PDF Chat) ---
export const chatWithScriba = async (
  message: string, 
  history: {role: string, parts: {text: string}[]}[], 
  documentContext: string,
  memory: UserMemory
): Promise<string> => {
  const ai = getClient();
  const relevantChunks = retrieveRelevantChunks(message, documentContext, {
    topK: 6,
    maxChunkChars: 1100,
    overlapChars: 180,
  });
  const groundedContext =
    relevantChunks.length > 0
      ? relevantChunks.join('\n\n---\n\n')
      : documentContext.substring(0, 12000);
  
  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    history: history,
    config: {
      systemInstruction: `
        ${constructSystemInstruction(memory, 'Trợ lý Tài liệu Scriba')}
        
        BỐI CẢNH TÀI LIỆU (đã truy hồi bằng local embedding chạy tại máy người dùng):
        ${groundedContext}
        
        HƯỚNG DẪN TRẢ LỜI:
        - Trả lời dựa trên bối cảnh tài liệu phía trên.
        - Giải thích dễ hiểu, phù hợp với học sinh ${memory.grade}.
        - NẾU CÓ CÔNG THỨC TOÁN: BẮTBUỘC viết theo format LaTeX markdown (xem nguyên tắc ở trên).
        - Nếu tài liệu có công thức nhưng chưa rõ: Hãy reformat lại thành LaTeX chuẩn.
        - Luôn dùng $...$ cho inline math và $$....$$ cho block math.
        - KHÔNG bao giờ escape ký tự $.
        - Luôn cung cấp ví dụ cụ thể khi giải thích công thức.
      `,
    }
  });

  try {
    const result = await chat.sendMessage({ message });
    return result.text || "Xin lỗi, tôi không thể xử lý yêu cầu này.";
  } catch (error) {
    console.error("Scriba Error:", error);
    return "Tôi đang gặp khó khăn khi đọc tài liệu lúc này.";
  }
};

// --- Feature: AI Notes ---
export const enhanceNote = async (content: string, action: 'summarize' | 'simplify' | 'quiz', memory: UserMemory): Promise<string> => {
  const ai = getClient();
  let prompt = "";
  
  switch(action) {
    case 'summarize': prompt = "Tóm tắt ghi chú này thành 3 ý chính quan trọng nhất."; break;
    case 'simplify': prompt = "Giải thích khái niệm này một cách đơn giản nhất, lấy ví dụ thực tế. Nếu có công thức toán, hãy giải thích từng bước."; break;
    case 'quiz': prompt = "Tạo 3 câu hỏi trắc nghiệm ôn tập dựa trên ghi chú này (có đáp án). Nếu có công thức toán, hãy dùng LaTeX."; break;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Nội dung: "${content}"\n\nYêu cầu: ${prompt}\n\nNHỚ: Nếu có công thức toán thì BẮTBUỘC dùng chuẩn markdown LaTeX: inline $...$, block $$...$$. KHÔNG escape ký tự $.`,
      config: {
        systemInstruction: constructSystemInstruction(memory, 'Gia sư Riêng'),
      }
    });
    return response.text || "";
  } catch (error) {
    return "Không thể xử lý ghi chú lúc này.";
  }
};
