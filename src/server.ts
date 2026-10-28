import { createApp } from './app';
import { env } from './config/env';
import { connectDB } from './config/prisma';

async function startServer() {
  try {
    await connectDB();
    console.log('✅ Kết nối Database thành công');

    const app = createApp();
    app.listen(env.PORT, () => {
      console.log(`🚀 Server đang chạy tại http://localhost:${env.PORT}`);
      console.log(`📑 Swagger Documentation tại http://localhost:${env.PORT}/api/docs`);
    });
  } catch (error) {
    console.error('❌ Lỗi khi khởi động server:', error);
    process.exit(1);
  }
}

startServer();
