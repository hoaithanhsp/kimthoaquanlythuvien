import * as mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface ParseResult {
    success: boolean;
    content: string;
    type: 'text' | 'table';
    tableData?: string[][];
    error?: string;
}

// Parse Word document (.docx)
export const parseWordFile = async (file: File): Promise<ParseResult> => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        return {
            success: true,
            content: result.value,
            type: 'text'
        };
    } catch (error: any) {
        return {
            success: false,
            content: '',
            type: 'text',
            error: `Lỗi đọc file Word: ${error.message}`
        };
    }
};

// Parse PDF file
export const parsePdfFile = async (file: File): Promise<ParseResult> => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
                .map((item: any) => item.str)
                .join(' ');
            fullText += pageText + '\n';
        }

        return {
            success: true,
            content: fullText,
            type: 'text'
        };
    } catch (error: any) {
        return {
            success: false,
            content: '',
            type: 'text',
            error: `Lỗi đọc file PDF: ${error.message}`
        };
    }
};

// Parse Excel file (.xlsx, .xls)
export const parseExcelFile = async (file: File): Promise<ParseResult> => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });

        // Get first sheet
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Convert to 2D array
        const data: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        // Convert to text format for AI processing
        const textContent = data
            .map(row => row.join(' | '))
            .join('\n');

        return {
            success: true,
            content: textContent,
            type: 'table',
            tableData: data
        };
    } catch (error: any) {
        return {
            success: false,
            content: '',
            type: 'text',
            error: `Lỗi đọc file Excel: ${error.message}`
        };
    }
};

// Auto-detect file type and parse
export const parseFile = async (file: File): Promise<ParseResult> => {
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.docx')) {
        return parseWordFile(file);
    } else if (fileName.endsWith('.pdf')) {
        return parsePdfFile(file);
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        return parseExcelFile(file);
    } else {
        return {
            success: false,
            content: '',
            type: 'text',
            error: 'Định dạng file không được hỗ trợ. Vui lòng sử dụng file Word (.docx), PDF (.pdf) hoặc Excel (.xlsx, .xls)'
        };
    }
};

// Get supported file extensions
export const SUPPORTED_EXTENSIONS = ['.docx', '.pdf', '.xlsx', '.xls'];
export const ACCEPT_FILE_TYPES = '.docx,.pdf,.xlsx,.xls';
