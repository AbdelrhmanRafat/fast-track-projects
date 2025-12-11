'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { getUserData, type UserData } from '@/lib/cookies';
import { useTranslation } from '@/hooks/useTranslation';

export default function HomePage() {
  const { t } = useTranslation();
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const userData: UserData | null = await getUserData();
      if (userData?.name) {
        setUserName(userData.name);
      }
    };
    fetchUserData();
  }, []);

  return (
    <div className="min-h-[calc(100vh-120px)] relative overflow-hidden">
      {/* Background with Logo Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div className="absolute inset-0 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8 p-8">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="flex items-center justify-center">
              <Image
                src="/app-logo.svg"
                alt=""
                width={200}
                height={50}
                className="w-full max-w-[200px] h-auto"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-120px)] px-4 py-12">
        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto space-y-8">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 rounded-3xl blur-2xl"></div>
              <Image
                src="/app-logo.svg"
                alt="Fast Track Logo"
                width={300}
                height={80}
                className="relative h-20 md:h-24 w-auto"
                priority
              />
            </div>
          </div>

          {/* Welcome Message */}
          {userName && (
            <h2 className="text-2xl md:text-3xl font-semibold text-primary">
              {t('home.welcome').replace('{{name}}', userName)}
            </h2>
          )}

          {/* Main Title */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
            فاست تراك للإدارة الخاصة بالمشتريات
          </h1>

          {/* Description */}
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
            فاست تراك للمشتريات هو تطبيق يدعم إنشاء طلبات الشراء، مراجعتها من جميع الأطراف، وتتبع حالة كل طلب حتى اكتمال عملية الشراء بنجاح.
          </p>

          {/* Workflow Steps */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 space-y-3 hover:shadow-lg hover:border-primary/30 transition-all duration-300">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-primary">١</span>
              </div>
              <h3 className="font-semibold text-foreground">إنشاء الطلب</h3>
              <p className="text-sm text-muted-foreground">
                يقوم المهندس أو الموقع بإنشاء طلب شراء جديد مع تحديد العناصر المطلوبة
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 space-y-3 hover:shadow-lg hover:border-primary/30 transition-all duration-300">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-primary">٢</span>
              </div>
              <h3 className="font-semibold text-foreground">المراجعة الهندسية</h3>
              <p className="text-sm text-muted-foreground">
                يقوم المهندس بمراجعة الطلب والتأكد من صحة البيانات قبل إرساله للإدارة
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 space-y-3 hover:shadow-lg hover:border-primary/30 transition-all duration-300">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-primary">٣</span>
              </div>
              <h3 className="font-semibold text-foreground">موافقة الإدارة</h3>
              <p className="text-sm text-muted-foreground">
                تقوم الإدارة بمراجعة الطلب والموافقة عليه أو رفضه مع توضيح السبب
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 space-y-3 hover:shadow-lg hover:border-primary/30 transition-all duration-300">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-primary">٤</span>
              </div>
              <h3 className="font-semibold text-foreground">تنفيذ الشراء</h3>
              <p className="text-sm text-muted-foreground">
                يقوم قسم المشتريات بتنفيذ الطلب وتحديث حالة كل عنصر حتى إغلاق الطلب
              </p>
            </div>
          </div>

          {/* Features Section */}
          <div className="mt-16 pt-12 border-t border-border/50">
            <h2 className="text-2xl font-bold text-foreground mb-8">مميزات النظام</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col items-center text-center space-y-3 p-4">
                <div className="w-14 h-14 bg-green-500/10 rounded-full flex items-center justify-center">
                  <svg className="w-7 h-7 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-foreground">تتبع الطلبات</h3>
                <p className="text-sm text-muted-foreground">متابعة حالة كل طلب في الوقت الفعلي</p>
              </div>

              <div className="flex flex-col items-center text-center space-y-3 p-4">
                <div className="w-14 h-14 bg-blue-500/10 rounded-full flex items-center justify-center">
                  <svg className="w-7 h-7 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-foreground">إدارة المستخدمين</h3>
                <p className="text-sm text-muted-foreground">صلاحيات متعددة حسب الدور الوظيفي</p>
              </div>

              <div className="flex flex-col items-center text-center space-y-3 p-4">
                <div className="w-14 h-14 bg-purple-500/10 rounded-full flex items-center justify-center">
                  <svg className="w-7 h-7 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-foreground">التقارير والطباعة</h3>
                <p className="text-sm text-muted-foreground">طباعة الطلبات وتصدير التقارير بسهولة</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
