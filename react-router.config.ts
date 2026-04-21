import type { Config } from '@react-router/dev/config';

export default {
  ssr: false,
  appDirectory: 'src',   // ← 이 줄 추가
  // 라우트는 파일 시스템 기반 (routes/ 폴더 규칙)
  // React Router v7 Framework mode 기본 설정
} satisfies Config;
