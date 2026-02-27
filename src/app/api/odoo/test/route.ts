import { NextRequest, NextResponse } from 'next/server';
import { testOdooConnection } from '@/lib/odoo';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: 'نام کاربری و رمز عبور الزامی است' },
        { status: 400 }
      );
    }

    const result = await testOdooConnection(username, password);
    return NextResponse.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'خطای ناشناخته';
    return NextResponse.json(
      { success: false, message: `خطا در تست اتصال: ${msg}` },
      { status: 500 }
    );
  }
}
