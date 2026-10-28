import * as xlsx from 'xlsx';
import { BadRequestError } from '../../errors/appError';

export interface ParsedLeadRow {
  rowNumber: number;
  data: {
    fullName: string;
    source: string;
    phone?: string;
    email?: string;
    company?: string;
    jobTitle?: string;
    address?: string;
    status?: string;
    notes?: string;
  };
  errors: string[];
  isValid: boolean;
}

export interface ParseExcelResult {
  sheetName: string;
  totalRows: number;
  skippedRows: number;
  parsedRows: ParsedLeadRow[];
}

const PHONE_REGEX = /^[+0-9() -]{8,20}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .trim()
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics for flexible matching
    .replace(/[^a-z0-9]/g, '');
}


interface ColumnMapping {
  key: keyof ParsedLeadRow['data'];
  colIndex: number;
}

export class ExcelLeadParser {
  /**
   * Parse an Excel buffer into structured lead rows with validation and row numbers
   */
  static parse(buffer: Buffer): ParseExcelResult {
    let workbook: xlsx.WorkBook;
    try {
      workbook = xlsx.read(buffer, { type: 'buffer' });
    } catch (err: any) {
      throw new BadRequestError('Không thể đọc file Excel. Định dạng file bị hỏng hoặc không đúng chuẩn: ' + err.message);
    }

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new BadRequestError('File Excel không có bất kỳ trang tính (sheet) nào.');
    }

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
      throw new BadRequestError(`Trang tính '${sheetName}' không tồn tại hoặc rỗng.`);
    }

    // Convert sheet to 2D array of rows
    const rows = xlsx.utils.sheet_to_json(sheet, {
      header: 1,
      defval: '',
      blankrows: false,
    }) as any[][];

    if (!rows || rows.length === 0) {
      throw new BadRequestError('File Excel không có dữ liệu.');
    }

    // 1. Identify header row (first non-empty row)
    let headerRowIndex = -1;
    for (let i = 0; i < rows.length; i++) {
      if (rows[i] && rows[i].some((cell: any) => String(cell).trim() !== '')) {
        headerRowIndex = i;
        break;
      }
    }

    if (headerRowIndex === -1) {
      throw new BadRequestError('File Excel hoàn toàn rỗng.');
    }

    const headerRow = rows[headerRowIndex].map((cell) => String(cell).trim());
    const columnMappings = this.resolveColumnMappings(headerRow);

    // Validate that required column headers exist
    const hasFullNameCol = columnMappings.some((m) => m.key === 'fullName');
    const hasSourceCol = columnMappings.some((m) => m.key === 'source');

    if (!hasFullNameCol || !hasSourceCol) {
      const missingCols: string[] = [];
      if (!hasFullNameCol) missingCols.push("'Họ và tên'");
      if (!hasSourceCol) missingCols.push("'Nguồn'");
      throw new BadRequestError(
        `Cấu trúc cột trong file Excel không hợp lệ: Thiếu các cột bắt buộc: ${missingCols.join(', ')}. ` +
        `Các tiêu đề cột được tìm thấy: [${headerRow.filter(Boolean).join(', ')}]`
      );
    }

    // 2. Iterate through data rows
    const parsedRows: ParsedLeadRow[] = [];
    let skippedRows = 0;

    // Track duplicates within the Excel file
    const seenPhones = new Map<string, number>(); // phone -> rowNumber
    const seenEmails = new Map<string, number>(); // email -> rowNumber

    for (let i = headerRowIndex + 1; i < rows.length; i++) {
      const row = rows[i];
      const excelRowNumber = i + 1; // 1-indexed Excel row

      // Check if entirely empty row
      const isBlank = !row || row.every((c) => String(c).trim() === '');
      if (isBlank) {
        skippedRows++;
        continue;
      }

      const rowData: ParsedLeadRow['data'] = {
        fullName: '',
        source: '',
      };

      for (const mapping of columnMappings) {
        const rawVal = row[mapping.colIndex];
        const val = rawVal !== undefined && rawVal !== null ? String(rawVal).trim() : '';
        if (val) {
          (rowData as any)[mapping.key] = val;
        }
      }

      const errors: string[] = [];

      // Validate fullName
      if (!rowData.fullName || rowData.fullName.trim() === '') {
        errors.push('Thiếu trường bắt buộc: Họ và tên');
      }

      // Validate source
      if (!rowData.source || rowData.source.trim() === '') {
        errors.push('Thiếu trường bắt buộc: Nguồn lead (source)');
      }

      // Validate phone format
      if (rowData.phone) {
        // Normalize phone: remove non-digits if needed or check pattern
        const cleanPhone = rowData.phone.trim();
        if (!PHONE_REGEX.test(cleanPhone)) {
          errors.push(`Định dạng số điện thoại không hợp lệ: '${rowData.phone}'`);
        } else {
          // Check intra-file duplicate phone
          if (seenPhones.has(cleanPhone)) {
            errors.push(`Số điện thoại '${cleanPhone}' bị trùng lặp với dòng ${seenPhones.get(cleanPhone)} trong file`);
          } else {
            seenPhones.set(cleanPhone, excelRowNumber);
          }
        }
      }

      // Validate email format
      if (rowData.email) {
        const cleanEmail = rowData.email.trim().toLowerCase();
        rowData.email = cleanEmail;
        if (!EMAIL_REGEX.test(cleanEmail)) {
          errors.push(`Định dạng email không hợp lệ: '${rowData.email}'`);
        } else {
          // Check intra-file duplicate email
          if (seenEmails.has(cleanEmail)) {
            errors.push(`Email '${cleanEmail}' bị trùng lặp với dòng ${seenEmails.get(cleanEmail)} trong file`);
          } else {
            seenEmails.set(cleanEmail, excelRowNumber);
          }
        }
      }

      // Default status
      if (!rowData.status) {
        rowData.status = 'NEW';
      }

      parsedRows.push({
        rowNumber: excelRowNumber,
        data: rowData,
        errors,
        isValid: errors.length === 0,
      });
    }

    return {
      sheetName,
      totalRows: parsedRows.length,
      skippedRows,
      parsedRows,
    };
  }

  private static resolveColumnMappings(headerRow: string[]): ColumnMapping[] {
    const mappings: ColumnMapping[] = [];

    headerRow.forEach((colName, index) => {
      const normalized = normalizeHeader(colName);

      if (
        normalized.includes('hovaten') ||
        normalized.includes('hoten') ||
        normalized === 'ten' ||
        normalized === 'tenkhachhang' ||
        normalized === 'fullname' ||
        normalized === 'name' ||
        normalized === 'customername'
      ) {
        mappings.push({ key: 'fullName', colIndex: index });
      } else if (
        normalized.includes('nguon') ||
        normalized.includes('nguonlead') ||
        normalized === 'source' ||
        normalized === 'leadsource'
      ) {
        mappings.push({ key: 'source', colIndex: index });
      } else if (
        normalized.includes('dienthoai') ||
        normalized.includes('sdt') ||
        normalized === 'phone' ||
        normalized === 'phonenumber' ||
        normalized === 'mobile' ||
        normalized === 'tel'
      ) {
        mappings.push({ key: 'phone', colIndex: index });
      } else if (
        normalized.includes('email') ||
        normalized.includes('thudientu') ||
        normalized === 'mail'
      ) {
        mappings.push({ key: 'email', colIndex: index });
      } else if (
        normalized.includes('congty') ||
        normalized.includes('doanhnghiep') ||
        normalized === 'company' ||
        normalized === 'companyname' ||
        normalized === 'organization'
      ) {
        mappings.push({ key: 'company', colIndex: index });
      } else if (
        normalized.includes('chucvu') ||
        normalized.includes('chucdanh') ||
        normalized.includes('vitri') ||
        normalized === 'jobtitle' ||
        normalized === 'title' ||
        normalized === 'position'
      ) {
        mappings.push({ key: 'jobTitle', colIndex: index });
      } else if (
        normalized.includes('diachi') ||
        normalized === 'address' ||
        normalized === 'location'
      ) {
        mappings.push({ key: 'address', colIndex: index });
      } else if (
        normalized.includes('trangthai') ||
        normalized.includes('tinhtrang') ||
        normalized === 'status'
      ) {
        mappings.push({ key: 'status', colIndex: index });
      } else if (
        normalized.includes('ghichu') ||
        normalized.includes('mota') ||
        normalized === 'note' ||
        normalized === 'notes' ||
        normalized === 'description'
      ) {
        mappings.push({ key: 'notes', colIndex: index });
      }
    });

    return mappings;
  }
}
