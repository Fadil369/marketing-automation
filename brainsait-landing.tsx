import React, { useState, useEffect } from 'react';
import { ChevronDown, Calendar, Mail, ExternalLink, Brain, Hospital, Users, Award, TrendingUp, CheckCircle, Menu, X, Globe, ArrowLeft, PlayCircle, Calculator, Download, Star } from 'lucide-react';

const BrainSAITLanding = () => {
  const [isRTL, setIsRTL] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  const [isVisible, setIsVisible] = useState({});

  // Language content
  const content = {
    ar: {
      nav: {
        features: 'المميزات',
        pricing: 'الأسعار',
        vision2030: 'رؤية 2030',
        book: 'احجز استشارة',
        demo: 'عرض تجريبي'
      },
      hero: {
        title: 'الذكاء الاصطناعي',
        subtitle: 'لمستقبل الرعاية الصحية السعودية',
        description: 'منصة GIVC - أول نظام ذكاء اصطناعي متكامل مصمم خصيصاً للمستشفيات السعودية متوافق 100% مع نفيس ورؤية 2030',
        cta1: 'شاهد العرض التجريبي',
        cta2: 'احسب عائد الاستثمار'
      },
      stats: [
        { value: '187.5M', label: 'ريال سعودي حجم السوق' },
        { value: '99.9%', label: 'توافق مع نفيس' },
        { value: '60%', label: 'تقليل الأخطاء الطبية' },
        { value: '15+', label: 'سنة خبرة طبية' }
      ],
      solutions: {
        title: 'حلول متكاملة للرعاية الصحية',
        items: [
          {
            icon: Hospital,
            title: 'منصة GIVC السحابية',
            description: 'نظام دعم القرار السريري بالذكاء الاصطناعي للمستشفيات',
            features: ['واجهة عربية بالكامل', 'تكامل مع أنظمة MOH', 'تحليلات متقدمة'],
            price: '9,400 ريال/شهر',
            gradient: 'from-purple-500 to-blue-500'
          },
          {
            icon: Brain,
            title: 'استشارات التحول الرقمي',
            description: 'خدمات استشارية متخصصة لرؤية 2030',
            features: ['تقييم الجاهزية الرقمية', 'خرائط التنفيذ المخصصة', 'الامتثال NPHIES/FHIR'],
            price: '188K - 1.9M ريال',
            gradient: 'from-blue-500 to-teal-500'
          },
          {
            icon: Users,
            title: 'أكاديمية BrainSAIT',
            description: 'برامج تدريبية معتمدة من وزارة الصحة',
            features: ['شهادات AI الصحية', 'برامج القيادة التنفيذية', 'التدريب المؤسسي'],
            price: '9,400 - 188K ريال',
            gradient: 'from-green-500 to-emerald-500'
          },
          {
            icon: Award,
            title: 'ترخيص التقنيات',
            description: 'حلول جاهزة للتكامل والتطبيق',
            features: ['خوارزميات AI عربية', 'قوالب تكامل نفيس', 'أطر الامتثال السعودية'],
            price: '94K - 750K ريال',
            gradient: 'from-orange-500 to-red-500'
          }
        ]
      }
    },
    en: {
      nav: {
        features: 'Features',
        pricing: 'Pricing',
        vision2030: 'Vision 2030',
        book: 'Book Consultation',
        demo: 'Demo'
      },
      hero: {
        title: 'Artificial Intelligence',
        subtitle: 'for Saudi Healthcare Future',
        description: 'GIVC Platform - First integrated AI system designed specifically for Saudi hospitals, 100% compliant with NPHIES and Vision 2030',
        cta1: 'Watch Demo',
        cta2: 'Calculate ROI'
      },
      stats: [
        { value: '187.5M', label: 'SAR Market Size' },
        { value: '99.9%', label: 'NPHIES Compliance' },
        { value: '60%', label: 'Medical Error Reduction' },
        { value: '15+', label: 'Years Medical Experience' }
      ],
      solutions: {
        title: 'Integrated Healthcare Solutions',
        items: [
          {
            icon: Hospital,
            title: 'GIVC Cloud Platform',
            description: 'Clinical Decision Support System with AI for hospitals',
            features: ['Full Arabic Interface', 'MOH Systems Integration', 'Advanced Analytics'],
            price: 'From 9,400 SAR/month',
            gradient: 'from-purple-500 to-blue-500'
          },
          {
            icon: Brain,
            title: 'Digital Transformation Consulting',
            description: 'Specialized consulting services for Vision 2030',
            features: ['Digital Readiness Assessment', 'Custom Implementation Maps', 'NPHIES/FHIR Compliance'],
            price: '188K - 1.9M SAR',
            gradient: 'from-blue-500 to-teal-500'
          },
          {
            icon: Users,
            title: 'BrainSAIT Academy',
            description: 'MOH-certified training programs',
            features: ['Healthcare AI Certifications', 'Executive Leadership Programs', 'Corporate Training'],
            price: '9,400 - 188K SAR',
            gradient: 'from-green-500 to-emerald-500'
          },
          {
            icon: Award,
            title: 'Technology Licensing',
            description: 'Ready-to-integrate solutions',
            features: ['Arabic AI Algorithms', 'NPHIES Integration Templates', 'Saudi Compliance Frameworks'],
            price: '94K - 750K SAR',
            gradient: 'from-orange-500 to-red-500'
          }
        ]
      }
    }
  };

  const t = content[isRTL ? 'ar' : 'en'];

  // Intersection Observer for animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(prev => ({ ...prev, [entry.target.id]: true }));
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('[id]').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const FloatingIcon = ({ children, delay = 0 }) => (
    <div 
      className="animate-bounce" 
      style={{ 
        animationDelay: `${delay}ms`,
        animationDuration: '3s'
      }}
    >
      {children}
    </div>
  );

  const CounterAnimation = ({ end, duration = 2000, suffix = '' }) => {
    const [count, setCount] = useState(0);
    
    useEffect(() => {
      let startTime;
      const animate = (currentTime) => {
        if (!startTime) startTime = currentTime;
        const progress = Math.min((currentTime - startTime) / duration, 1);
        setCount(Math.floor(progress * end));
        if (progress < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    }, [end, duration]);

    return <span>{count}{suffix}</span>;
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 ${isRTL ? 'font-arabic' : 'font-english'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Enhanced Navigation */}
      <nav className="fixed w-full bg-white/95 backdrop-blur-md shadow-lg z-50 transition-all duration-300">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  BrainSAIT
                </span>
                <div className="text-xs text-gray-500">Healthcare AI Platform</div>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex gap-8 items-center">
              <a href="#features" className="hover:text-purple-600 transition-colors duration-200 font-medium">
                {t.nav.features}
              </a>
              <a href="#pricing" className="hover:text-purple-600 transition-colors duration-200 font-medium">
                {t.nav.pricing}
              </a>
              <a href="#vision2030" className="hover:text-purple-600 transition-colors duration-200 font-medium">
                {t.nav.vision2030}
              </a>
              
              {/* Language Toggle */}
              <button
                onClick={() => setIsRTL(!isRTL)}
                className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200 flex items-center gap-2"
              >
                <Globe className="w-4 h-4" />
                {isRTL ? 'EN' : 'العربية'}
              </button>

              {/* CTA Buttons */}
              <button className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-all duration-200 flex items-center gap-2">
                <PlayCircle className="w-4 h-4" />
                {t.nav.demo}
              </button>
              
              <a 
                href="https://calendly.com/fadil369"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 font-medium"
              >
                <Calendar className="w-4 h-4" />
                {t.nav.book}
              </a>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="lg:hidden mt-4 py-4 border-t border-gray-200">
              <div className="flex flex-col space-y-4">
                <a href="#features" className="py-2 hover:text-purple-600 transition-colors">
                  {t.nav.features}
                </a>
                <a href="#pricing" className="py-2 hover:text-purple-600 transition-colors">
                  {t.nav.pricing}
                </a>
                <a href="#vision2030" className="py-2 hover:text-purple-600 transition-colors">
                  {t.nav.vision2030}
                </a>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setIsRTL(!isRTL)}
                    className="flex-1 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <Globe className="w-4 h-4" />
                    {isRTL ? 'EN' : 'عربي'}
                  </button>
                  <a 
                    href="https://calendly.com/fadil369"
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-center"
                  >
                    {t.nav.book}
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Enhanced Hero Section */}
      <section id="hero" className="pt-32 pb-20 px-6 overflow-hidden">
        <div className="container mx-auto text-center relative">
          {/* Floating Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-10 opacity-20">
              <FloatingIcon delay={0}>
                <div className="w-20 h-20 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full blur-xl"></div>
              </FloatingIcon>
            </div>
            <div className="absolute top-40 right-16 opacity-20">
              <FloatingIcon delay={1000}>
                <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-teal-400 rounded-full blur-xl"></div>
              </FloatingIcon>
            </div>
            <div className="absolute bottom-20 left-1/4 opacity-20">
              <FloatingIcon delay={2000}>
                <div className="w-24 h-24 bg-gradient-to-r from-orange-400 to-red-400 rounded-full blur-xl"></div>
              </FloatingIcon>
            </div>
          </div>

          {/* Main Content */}
          <div className="relative z-10">
            <div className="mb-8">
              <FloatingIcon>
                <span className="text-6xl">🚀</span>
              </FloatingIcon>
            </div>
            
            <h1 className={`text-5xl md:text-7xl font-bold mb-6 leading-tight ${isVisible.hero ? 'animate-fade-in-up' : 'opacity-0'}`}>
              <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-teal-600 bg-clip-text text-transparent">
                {t.hero.title}
              </span>
              <br />
              <span className="text-gray-800">{t.hero.subtitle}</span>
            </h1>
            
            <p className={`text-xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed ${isVisible.hero ? 'animate-fade-in-up' : 'opacity-0'} transition-all delay-300`}>
              {t.hero.description}
            </p>
            
            <div className={`flex gap-6 justify-center flex-wrap ${isVisible.hero ? 'animate-fade-in-up' : 'opacity-0'} transition-all delay-500`}>
              <button className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-2xl transition-all duration-300 text-lg transform hover:scale-105 flex items-center gap-3">
                <PlayCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                {t.hero.cta1}
              </button>
              <button className="group px-8 py-4 bg-white border-2 border-purple-600 text-purple-600 rounded-xl font-semibold hover:bg-purple-50 transition-all duration-300 text-lg transform hover:scale-105 flex items-center gap-3">
                <Calculator className="w-5 h-5 group-hover:scale-110 transition-transform" />
                {t.hero.cta2}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Statistics */}
      <section id="stats" className="py-20 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {t.stats.map((stat, index) => (
              <div 
                key={index}
                className={`text-center group hover:scale-105 transition-all duration-300 ${isVisible.stats ? 'animate-fade-in-up' : 'opacity-0'}`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300">
                  <div className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-3">
                    {stat.value}
                  </div>
                  <div className="text-gray-600 text-sm lg:text-base font-medium">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Solutions Section */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className={`text-4xl lg:text-5xl font-bold mb-6 ${isVisible.features ? 'animate-fade-in-up' : 'opacity-0'}`}>
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                {t.solutions.title}
              </span>
            </h2>
          </div>
          
          <div className="grid lg:grid-cols-2 xl:grid-cols-4 gap-8">
            {t.solutions.items.map((solution, index) => {
              const IconComponent = solution.icon;
              return (
                <div 
                  key={index}
                  className={`group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100 ${isVisible.features ? 'animate-fade-in-up' : 'opacity-0'}`}
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  {/* Icon */}
                  <div className={`w-16 h-16 bg-gradient-to-r ${solution.gradient} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-xl font-bold mb-4 text-gray-800">{solution.title}</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">{solution.description}</p>
                  
                  {/* Features */}
                  <ul className="space-y-3 mb-6">
                    {solution.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  {/* Pricing */}
                  <div className="pt-6 border-t border-gray-100">
                    <div className="text-sm text-gray-500 mb-1">يبدأ من</div>
                    <div className={`text-2xl font-bold bg-gradient-to-r ${solution.gradient} bg-clip-text text-transparent`}>
                      {solution.price}
                    </div>
                  </div>
                  
                  {/* CTA */}
                  <button className="w-full mt-6 px-6 py-3 bg-gray-50 hover:bg-gray-100 text-gray-800 rounded-lg transition-all duration-200 font-medium group-hover:bg-purple-50 group-hover:text-purple-700">
                    تعلم المزيد
                    <ArrowLeft className={`w-4 h-4 inline ${isRTL ? 'mr-2 rotate-180' : 'ml-2'} group-hover:translate-x-1 transition-transform`} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Enhanced Vision 2030 Section */}
      <section id="vision2030" className="py-20 bg-gradient-to-br from-purple-600 via-blue-600 to-teal-600 text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <div className={`inline-block p-6 bg-white/20 backdrop-blur rounded-2xl mb-8 ${isVisible.vision2030 ? 'animate-fade-in-up' : 'opacity-0'}`}>
              <span className="text-6xl">🇸🇦</span>
            </div>
            <h2 className={`text-4xl lg:text-5xl font-bold mb-6 ${isVisible.vision2030 ? 'animate-fade-in-up' : 'opacity-0'} transition-all delay-300`}>
              متوافق مع رؤية السعودية 2030
            </h2>
            <p className={`text-xl max-w-3xl mx-auto leading-relaxed ${isVisible.vision2030 ? 'animate-fade-in-up' : 'opacity-0'} transition-all delay-500`}>
              نساهم في تحقيق أهداف التحول الرقمي للقطاع الصحي السعودي وبناء اقتصاد معرفي مزدهر
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: '🏗️', title: 'التحول الرقمي', desc: 'تمكين رقمنة القطاع الصحي بحلول AI متقدمة ومتوافقة مع أعلى المعايير العالمية' },
              { icon: '👥', title: 'تطوير الكوادر', desc: 'برامج تدريبية معتمدة لبناء قدرات الكوادر الوطنية في مجال الذكاء الاصطناعي الطبي' },
              { icon: '🚀', title: 'الابتكار المحلي', desc: 'تطوير تقنيات صحية محلية عالمية المستوى تعزز من مكانة المملكة التقنية' }
            ].map((item, index) => (
              <div 
                key={index}
                className={`bg-white/10 backdrop-blur rounded-xl p-8 hover:bg-white/20 transition-all duration-300 transform hover:scale-105 ${isVisible.vision2030 ? 'animate-fade-in-up' : 'opacity-0'}`}
                style={{ animationDelay: `${index * 200 + 700}ms` }}
              >
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-xl font-bold mb-4">{item.title}</h3>
                <p className="leading-relaxed opacity-90">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section className="py-20 bg-gradient-to-br from-purple-100 via-blue-50 to-teal-50">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-gray-800">
            ابدأ رحلة التحول الرقمي اليوم
          </h2>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            انضم إلى المستشفيات الرائدة في المملكة في تبني حلول الذكاء الاصطناعي وكن جزءاً من مستقبل الرعاية الصحية
          </p>
          
          <div className="flex gap-6 justify-center flex-wrap mb-12">
            <a 
              href="https://calendly.com/fadil369"
              target="_blank"
              rel="noopener noreferrer"
              className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:shadow-2xl transition-all duration-300 text-lg transform hover:scale-105 flex items-center gap-3"
            >
              <Calendar className="w-5 h-5 group-hover:scale-110 transition-transform" />
              احجز استشارة مجانية
            </a>
            <a 
              href="mailto:dr.mf.12298@gmail.com"
              className="group px-8 py-4 bg-white text-purple-600 border-2 border-purple-600 rounded-xl font-semibold hover:bg-purple-50 transition-all duration-300 text-lg transform hover:scale-105 flex items-center gap-3"
            >
              <Mail className="w-5 h-5 group-hover:scale-110 transition-transform" />
              تواصل معنا
            </a>
          </div>

          {/* Trust Indicators */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { icon: Star, label: '4.9/5 تقييم العملاء' },
              { icon: CheckCircle, label: '100% متوافق مع نفيس' },
              { icon: Award, label: 'معتمد من وزارة الصحة' },
              { icon: TrendingUp, label: '300% متوسط عائد الاستثمار' }
            ].map((item, index) => (
              <div key={index} className="bg-white rounded-xl p-4 shadow-lg">
                <item.icon className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <div className="text-sm font-medium text-gray-700">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Company Info */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <span className="text-2xl font-bold">BrainSAIT</span>
                  <div className="text-xs text-gray-400">Healthcare AI Platform</div>
                </div>
              </div>
              <p className="text-gray-400 leading-relaxed mb-6">
                دعم التحول الرقمي للرعاية الصحية في المملكة العربية السعودية من خلال حلول الذكاء الاصطناعي المتقدمة
              </p>
              <div className="flex gap-4">
                {[
                  { href: 'https://linkedin.com/in/fadil369', label: 'LinkedIn' },
                  { href: 'https://x.com/brainsait369', label: 'X' },
                  { href: 'https://github.com/fadil369', label: 'GitHub' }
                ].map((social, index) => (
                  <a 
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-purple-600 transition-colors duration-200"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Solutions */}
            <div>
              <h4 className="font-bold mb-6 text-lg">الحلول</h4>
              <ul className="space-y-3">
                {['منصة GIVC', 'الاستشارات', 'التدريب', 'التراخيص'].map((item, index) => (
                  <li key={index}>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200 flex items-center gap-2">
                      <ArrowLeft className={`w-3 h-3 ${isRTL ? 'rotate-180' : ''}`} />
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-bold mb-6 text-lg">الشركة</h4>
              <ul className="space-y-3">
                {['عن BrainSAIT', 'رؤية 2030', 'الشركاء', 'التوظيف'].map((item, index) => (
                  <li key={index}>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200 flex items-center gap-2">
                      <ArrowLeft className={`w-3 h-3 ${isRTL ? 'rotate-180' : ''}`} />
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-bold mb-6 text-lg">تواصل معنا</h4>
              <ul className="space-y-4 text-gray-400">
                <li className="flex items-start gap-3">
                  <span>📍</span>
                  <span>الرياض، المملكة العربية السعودية</span>
                </li>
                <li className="flex items-start gap-3">
                  <span>📧</span>
                  <a href="mailto:dr.mf.12298@gmail.com" className="hover:text-white transition-colors">
                    dr.mf.12298@gmail.com
                  </a>
                </li>
                <li className="flex items-start gap-3">
                  <span>📅</span>
                  <a href="https://calendly.com/fadil369" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                    احجز موعد استشارة
                  </a>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-gray-400">
              © 2025 Dr. Mohamed El Fadil | BrainSAIT. جميع الحقوق محفوظة
            </p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .font-arabic {
          font-family: 'Tajawal', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        
        .font-english {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
      `}</style>
    </div>
  );
};

export default BrainSAITLanding;