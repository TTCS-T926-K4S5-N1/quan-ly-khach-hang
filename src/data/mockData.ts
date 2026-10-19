import { Deal, Stage } from '../types';

export const STAGES: Stage[] = [
  {
    id: 'lead',
    name: '1. Tiếp cận (Lead)',
    requiredConditions: () => []
  },
  {
    id: 'qualification',
    name: '2. Sàng lọc & Gặp mặt',
    requiredConditions: (deal: Deal) => [
      {
        id: 'meeting_required',
        name: 'Đã ghi nhận cuộc gặp',
        isMet: deal.loggedMeetingsCount > 0,
        details: `Cần ít nhất 1 cuộc gặp (Hiện tại: ${deal.loggedMeetingsCount})`
      }
    ]
  },
  {
    id: 'proposal',
    name: '3. Đề xuất / Báo giá',
    requiredConditions: (deal: Deal) => [
      {
        id: 'meeting_required',
        name: 'Đã ghi nhận cuộc gặp khách hàng',
        isMet: deal.loggedMeetingsCount > 0,
        details: `Cần ít nhất 1 cuộc gặp (Hiện tại: ${deal.loggedMeetingsCount})`
      },
      {
        id: 'proposal_sent',
        name: 'Đã gửi file Báo giá/Đề xuất',
        isMet: deal.hasProposal,
        details: deal.hasProposal ? 'Đã đính kèm báo giá' : 'Chưa đính kèm tài liệu báo giá'
      }
    ]
  },
  {
    id: 'closed_won',
    name: '4. Chốt hợp đồng (Won)',
    requiredConditions: (deal: Deal) => [
      {
        id: 'contract_signed',
        name: 'Hợp đồng đã ký kết',
        isMet: deal.contractSigned,
        details: deal.contractSigned ? 'Hợp đồng hợp lệ' : 'Chưa upload hợp đồng đã ký'
      }
    ]
  }
];

export const INITIAL_DEALS: Deal[] = [
  {
    id: 'deal-1',
    title: 'Hợp đồng Phần mềm CRM - Tập đoàn A',
    value: 500000000,
    company: 'Công ty Cổ phần Tập đoàn A',
    currentStage: 'lead',
    loggedMeetingsCount: 0,
    hasProposal: false,
    contractSigned: false,
    overrideHistory: []
  },
  {
    id: 'deal-2',
    title: 'Gói tư vấn Chuyển đổi số - Tech Corp',
    value: 250000000,
    company: 'Tech Corp Vietnam',
    currentStage: 'qualification',
    loggedMeetingsCount: 2,
    hasProposal: true,
    contractSigned: false,
    overrideHistory: []
  }
];
