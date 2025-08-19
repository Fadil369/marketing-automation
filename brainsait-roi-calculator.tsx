import React, { useState, useEffect, useCallback } from 'react';
import { Brain, Calculator, TrendingUp, Download, Calendar, Mail, ChevronRight, ChevronLeft, Info, CheckCircle, AlertTriangle, BarChart3, PieChart, LineChart, DollarSign, Clock, Users, Award, Printer, Share2, FileText, ArrowUp, ArrowDown, Building2 } from 'lucide-react';

const BrainSAITROICalculator = () => {
  const [formData, setFormData] = useState({
    hospitalType: 'regional',
    bedCount: 200,
    patientCount: 5000,
    itSpending: 150000,
    currentStaff: 150,
    averageError: 2.5,
    services: {
      saas: true,
      consulting: true,
      training: true,
      licensing: false
    }
  });

  const [results, setResults] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isCalculating, setIsCalculating] = useState(false);
  const [chartView, setChartView] = useState('timeline');
  const [comparisonData, setComparisonData] = useState(null);

  // Hospital type configurations
  const hospitalConfigs = {
    primary: {
      baseCost: 9400,
      implementation: 56000,
      staffMultiplier: 0.8,
      errorReduction: 0.55,
      timeReduction: 0.35,
      patientSatisfaction: 0.75
    },
    regional: {
      baseCost: 32000,
      implementation: 94000,
      staffMultiplier: 1.0,
      errorReduction: 0.60,
      timeReduction: 0.40,
      patientSatisfaction: 0.85
    },
    medical_city: {
      baseCost: 94000,
      implementation: 188000,
      staffMultiplier: 1.2,
      errorReduction: 0.65,
      timeReduction: 0.45,
      patientSatisfaction: 0.90
    }
  };

  // Calculate ROI with enhanced logic
  const calculateROI = useCallback(() => {
    setIsCalculating(true);
    
    setTimeout(() => {
      const config = hospitalConfigs[formData.hospitalType];
      let monthlyInvestment = 0;
      let implementationCost = 0;
      
      // Service costs calculation
      if (formData.services.saas) {
        monthlyInvestment += config.baseCost;
        implementationCost += config.implementation;
      }
      
      if (formData.services.consulting) {
        implementationCost += 375000;
      }
      
      if (formData.services.training) {
        const trainingStaff = Math.floor(formData.currentStaff * 0.3);
        implementationCost += trainingStaff * 3000;
      }
      
      if (formData.services.licensing) {
        implementationCost += 188000;
      }

      // Benefits calculation
      const errorCostPerPatient = 750;
      const errorRateBaseline = formData.averageError / 100;
      const monthlySavingsFromErrors = formData.patientCount * errorCostPerPatient * errorRateBaseline * config.errorReduction;
      
      const averageStaffSalary = 8000;
      const monthlySavingsFromTime = formData.currentStaff * averageStaffSalary * config.timeReduction * 0.3;
      
      const monthlySavingsFromEfficiency = formData.itSpending * 0.25;
      
      const totalMonthlySavings = monthlySavingsFromErrors + monthlySavingsFromTime + monthlySavingsFromEfficiency;
      const annualSavings = totalMonthlySavings * 12;
      const annualInvestment = (monthlyInvestment * 12) + (implementationCost / 3);
      
      const roi = ((annualSavings - annualInvestment) / annualInvestment) * 100;
      const netBenefit = annualSavings - annualInvestment;
      const paybackMonths = Math.ceil(implementationCost / (totalMonthlySavings - monthlyInvestment));
      
      // Generate 5-year projection
      const projectionData = [];
      let cumulativeSavings = 0;
      let cumulativeCosts = implementationCost;
      
      for (let year = 1; year <= 5; year++) {
        const yearlySavings = annualSavings * Math.pow(1.05, year - 1); // 5% annual growth
        const yearlyCosts = monthlyInvestment * 12 * Math.pow(1.03, year - 1); // 3% annual cost increase
        
        cumulativeSavings += yearlySavings;
        cumulativeCosts += yearlyCosts;
        
        projectionData.push({
          year,
          savings: yearlySavings,
          costs: yearlyCosts,
          netBenefit: yearlySavings - yearlyCosts,
          cumulativeSavings,
          cumulativeCosts,
          cumulativeNet: cumulativeSavings - cumulativeCosts,
          roi: ((cumulativeSavings - cumulativeCosts) / cumulativeCosts) * 100
        });
      }

      // Savings breakdown
      const savingsBreakdown = {
        errorReduction: monthlySavingsFromErrors * 12,
        timeEfficiency: monthlySavingsFromTime * 12,
        operationalEfficiency: monthlySavingsFromEfficiency * 12
      };

      // Risk assessment
      const riskFactors = {
        implementation: implementationCost > 500000 ? 'high' : implementationCost > 200000 ? 'medium' : 'low',
        payback: paybackMonths > 24 ? 'high' : paybackMonths > 12 ? 'medium' : 'low',
        complexity: Object.values(formData.services).filter(Boolean).length > 2 ? 'medium' : 'low'
      };

      setResults({
        monthlyInvestment,
        annualInvestment,
        implementationCost,
        annualSavings,
        roi,
        netBenefit,
        paybackMonths,
        projectionData,
        savingsBreakdown,
        riskFactors,
        benefits: {
          errorReduction: config.errorReduction,
          timeReduction: config.timeReduction,
          patientSatisfaction: config.patientSatisfaction,
          efficiencyGain: 0.35
        }
      });
      
      setIsCalculating(false);
    }, 2000);
  }, [formData]);

  // Auto-calculate when data changes
  useEffect(() => {
    if (currentStep >= 3) {
      calculateROI();
    }
  }, [formData, currentStep, calculateROI]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleServiceChange = (service, checked) => {
    setFormData(prev => ({
      ...prev,
      services: {
        ...prev.services,
        [service]: checked
      }
    }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('ar-SA').format(num);
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getRiskIcon = (risk) => {
    switch (risk) {
      case 'low': return CheckCircle;
      case 'medium': case 'high': return AlertTriangle;
      default: return Info;
    }
  };

  // Chart components
  const TimelineChart = () => {
    if (!results) return null;
    
    return (
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <LineChart className="w-5 h-5 text-blue-600" />
          التوقعات المالية (5 سنوات)
        </h3>
        <div className="h-64 flex items-end justify-between gap-2">
          {results.projectionData.map((data, index) => {
            const maxValue = Math.max(...results.projectionData.map(d => d.cumulativeSavings));
            const savingsHeight = (data.cumulativeSavings / maxValue) * 200;
            const costsHeight = (data.cumulativeCosts / maxValue) * 200;
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="w-full relative mb-2" style={{ height: '200px' }}>
                  <div 
                    className="absolute bottom-0 w-full bg-green-400 rounded-t opacity-80"
                    style={{ height: `${savingsHeight}px` }}
                  ></div>
                  <div 
                    className="absolute bottom-0 w-full bg-red-400 rounded-t opacity-60"
                    style={{ height: `${costsHeight}px` }}
                  ></div>
                </div>
                <div className="text-xs text-center">
                  <div className="font-medium">سنة {data.year}</div>
                  <div className="text-green-600">{formatCurrency(data.cumulativeNet)}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-400 rounded"></div>
            <span>إجمالي التوفير</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-400 rounded"></div>
            <span>إجمالي الاستثمار</span>
          </div>
        </div>
      </div>
    );
  };

  const BreakdownChart = () => {
    if (!results) return null;
    
    const total = Object.values(results.savingsBreakdown).reduce((sum, val) => sum + val, 0);
    
    return (
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <PieChart className="w-5 h-5 text-purple-600" />
          توزيع التوفير السنوي
        </h3>
        <div className="space-y-4">
          {Object.entries(results.savingsBreakdown).map(([key, value], index) => {
            const percentage = (value / total) * 100;
            const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500'];
            const labels = {
              errorReduction: 'تقليل الأخطاء الطبية',
              timeEfficiency: 'توفير الوقت والكفاءة',
              operationalEfficiency: 'تحسين العمليات'
            };
            
            return (
              <div key={key} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{labels[key]}</span>
                  <span className="text-sm text-gray-600">{formatCurrency(value)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${colors[index]}`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <div className="text-right text-xs text-gray-500">{percentage.toFixed(1)}%</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const ComparisonTable = () => {
    if (!results) return null;
    
    return (
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-orange-600" />
          مقارنة الأداء المالي
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-right py-2">المؤشر</th>
                <th className="text-center py-2">الوضع الحالي</th>
                <th className="text-center py-2">مع BrainSAIT</th>
                <th className="text-center py-2">التحسن</th>
              </tr>
            </thead>
            <tbody className="space-y-2">
              <tr className="border-b">
                <td className="py-3 font-medium">التكلفة الشهرية</td>
                <td className="text-center">{formatCurrency(formData.itSpending)}</td>
                <td className="text-center">{formatCurrency(formData.itSpending + results.monthlyInvestment)}</td>
                <td className="text-center text-blue-600">+{formatCurrency(results.monthlyInvestment)}</td>
              </tr>
              <tr className="border-b">
                <td className="py-3 font-medium">التوفير الشهري</td>
                <td className="text-center">-</td>
                <td className="text-center">{formatCurrency(results.annualSavings / 12)}</td>
                <td className="text-center text-green-600 flex items-center justify-center gap-1">
                  <ArrowUp className="w-4 h-4" />
                  {formatCurrency(results.annualSavings / 12)}
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3 font-medium">معدل الأخطاء</td>
                <td className="text-center">{formData.averageError}%</td>
                <td className="text-center">{(formData.averageError * (1 - results.benefits.errorReduction)).toFixed(1)}%</td>
                <td className="text-center text-green-600 flex items-center justify-center gap-1">
                  <ArrowDown className="w-4 h-4" />
                  {(formData.averageError * results.benefits.errorReduction).toFixed(1)}%
                </td>
              </tr>
              <tr>
                <td className="py-3 font-medium">رضا المرضى</td>
                <td className="text-center">75%</td>
                <td className="text-center">{(75 + (results.benefits.patientSatisfaction * 20)).toFixed(0)}%</td>
                <td className="text-center text-green-600 flex items-center justify-center gap-1">
                  <ArrowUp className="w-4 h-4" />
                  {(results.benefits.patientSatisfaction * 20).toFixed(0)}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 font-arabic" dir="rtl">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  BrainSAIT حاسبة عائد الاستثمار
                </h1>
                <p className="text-sm text-gray-600">حساب دقيق للفوائد المالية والتشغيلية</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <button className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2">
                <Printer className="w-4 h-4" />
                طباعة
              </button>
              <button className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                مشاركة
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center mb-4">
            {[
              { step: 1, title: 'معلومات المنشأة', icon: Building2 },
              { step: 2, title: 'الخدمات المطلوبة', icon: CheckCircle },
              { step: 3, title: 'النتائج والتحليل', icon: TrendingUp }
            ].map((item, index) => {
              const IconComponent = item.icon;
              const isActive = currentStep >= item.step;
              const isCompleted = currentStep > item.step;
              
              return (
                <React.Fragment key={item.step}>
                  <div className={`flex flex-col items-center ${isActive ? 'text-purple-600' : 'text-gray-400'}`}>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all duration-300 ${
                      isCompleted ? 'bg-green-500 text-white' : 
                      isActive ? 'bg-purple-600 text-white' : 'bg-gray-200'
                    }`}>
                      {isCompleted ? <CheckCircle className="w-6 h-6" /> : <IconComponent className="w-6 h-6" />}
                    </div>
                    <span className="text-sm font-medium text-center">{item.title}</span>
                  </div>
                  {index < 2 && (
                    <div className={`h-0.5 w-24 mx-4 transition-colors duration-300 ${
                      currentStep > item.step ? 'bg-green-500' : currentStep === item.step ? 'bg-purple-600' : 'bg-gray-200'
                    }`}></div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Input Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-8 sticky top-8">
              {currentStep === 1 && (
                <div>
                  <h2 className="text-2xl font-bold mb-6 text-gray-800">معلومات المنشأة الصحية</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">نوع المنشأة الصحية</label>
                      <select 
                        value={formData.hospitalType}
                        onChange={(e) => handleInputChange('hospitalType', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="primary">مركز رعاية أولية (20-100 سرير)</option>
                        <option value="regional">مستشفى إقليمي (100-400 سرير)</option>
                        <option value="medical_city">مدينة طبية (400+ سرير)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">عدد الأسرّة</label>
                      <input 
                        type="number"
                        value={formData.bedCount}
                        onChange={(e) => handleInputChange('bedCount', parseInt(e.target.value))}
                        min="20" max="1000"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">متوسط عدد المرضى الشهري</label>
                      <input 
                        type="number"
                        value={formData.patientCount}
                        onChange={(e) => handleInputChange('patientCount', parseInt(e.target.value))}
                        min="100" max="50000"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">عدد الطاقم الطبي</label>
                      <input 
                        type="number"
                        value={formData.currentStaff}
                        onChange={(e) => handleInputChange('currentStaff', parseInt(e.target.value))}
                        min="10" max="2000"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">الإنفاق الحالي على تقنية المعلومات (ريال/شهر)</label>
                      <input 
                        type="number"
                        value={formData.itSpending}
                        onChange={(e) => handleInputChange('itSpending', parseInt(e.target.value))}
                        min="10000" max="1000000" step="1000"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">معدل الأخطاء الطبية الحالي (%)</label>
                      <input 
                        type="number"
                        value={formData.averageError}
                        onChange={(e) => handleInputChange('averageError', parseFloat(e.target.value))}
                        min="0.1" max="10" step="0.1"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div>
                  <h2 className="text-2xl font-bold mb-6 text-gray-800">الخدمات المطلوبة</h2>
                  
                  <div className="space-y-4">
                    {[
                      { 
                        key: 'saas', 
                        title: 'منصة GIVC السحابية', 
                        desc: 'نظام دعم القرار السريري بالذكاء الاصطناعي',
                        price: hospitalConfigs[formData.hospitalType].baseCost
                      },
                      { 
                        key: 'consulting', 
                        title: 'استشارات التحول الرقمي', 
                        desc: 'خدمات استشارية متخصصة لرؤية 2030',
                        price: 375000
                      },
                      { 
                        key: 'training', 
                        title: 'برامج التدريب والتأهيل', 
                        desc: 'برامج تدريبية معتمدة من وزارة الصحة',
                        price: Math.floor(formData.currentStaff * 0.3) * 3000
                      },
                      { 
                        key: 'licensing', 
                        title: 'تراخيص التقنيات', 
                        desc: 'حلول جاهزة للتكامل والتطبيق',
                        price: 188000
                      }
                    ].map((service) => (
                      <label key={service.key} className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.services[service.key]}
                          onChange={(e) => handleServiceChange(service.key, e.target.checked)}
                          className="mt-1 w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-800">{service.title}</div>
                          <div className="text-sm text-gray-600 mb-2">{service.desc}</div>
                          <div className="text-sm font-medium text-purple-600">
                            {service.key === 'saas' ? `${formatCurrency(service.price)}/شهر` : formatCurrency(service.price)}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between mt-8">
                {currentStep > 1 && (
                  <button
                    onClick={() => setCurrentStep(currentStep - 1)}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
                  >
                    <ChevronRight className="w-4 h-4" />
                    السابق
                  </button>
                )}
                {currentStep < 3 && (
                  <button
                    onClick={() => setCurrentStep(currentStep + 1)}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2 mr-auto"
                  >
                    التالي
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                )}
                {currentStep === 3 && (
                  <button
                    onClick={calculateROI}
                    disabled={isCalculating}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2 mr-auto disabled:opacity-50"
                  >
                    {isCalculating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        جاري الحساب...
                      </>
                    ) : (
                      <>
                        <Calculator className="w-4 h-4" />
                        إعادة الحساب
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-2">
            {currentStep >= 3 && results && (
              <div className="space-y-8">
                {/* Key Metrics */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { 
                      title: 'الاستثمار السنوي', 
                      value: formatCurrency(results.annualInvestment), 
                      color: 'purple',
                      icon: DollarSign,
                      change: null
                    },
                    { 
                      title: 'التوفير السنوي', 
                      value: formatCurrency(results.annualSavings), 
                      color: 'green',
                      icon: TrendingUp,
                      change: '+' + ((results.annualSavings / (formData.itSpending * 12)) * 100).toFixed(0) + '%'
                    },
                    { 
                      title: 'عائد الاستثمار', 
                      value: results.roi.toFixed(0) + '%', 
                      color: 'blue',
                      icon: BarChart3,
                      change: results.roi > 200 ? 'ممتاز' : results.roi > 100 ? 'جيد جداً' : 'مقبول'
                    },
                    { 
                      title: 'فترة الاسترداد', 
                      value: results.paybackMonths + ' شهر', 
                      color: 'orange',
                      icon: Clock,
                      change: results.paybackMonths <= 12 ? 'سريع' : results.paybackMonths <= 24 ? 'متوسط' : 'طويل'
                    }
                  ].map((metric, index) => {
                    const IconComponent = metric.icon;
                    return (
                      <div key={index} className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                          <div className={`w-12 h-12 bg-${metric.color}-100 rounded-lg flex items-center justify-center`}>
                            <IconComponent className={`w-6 h-6 text-${metric.color}-600`} />
                          </div>
                          {metric.change && (
                            <div className={`px-2 py-1 bg-${metric.color}-50 text-${metric.color}-700 text-xs rounded-full`}>
                              {metric.change}
                            </div>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 mb-1">{metric.title}</div>
                        <div className={`text-2xl font-bold text-${metric.color}-600`}>{metric.value}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Chart Section */}
                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">التحليل المالي التفصيلي</h2>
                    <div className="flex bg-gray-100 rounded-lg p-1">
                      {[
                        { key: 'timeline', label: 'الخط الزمني', icon: LineChart },
                        { key: 'breakdown', label: 'التوزيع', icon: PieChart },
                        { key: 'comparison', label: 'المقارنة', icon: BarChart3 }
                      ].map((view) => {
                        const IconComponent = view.icon;
                        return (
                          <button
                            key={view.key}
                            onClick={() => setChartView(view.key)}
                            className={`px-4 py-2 rounded-md flex items-center gap-2 transition-colors ${
                              chartView === view.key 
                                ? 'bg-white shadow-sm text-purple-600' 
                                : 'text-gray-600 hover:text-gray-800'
                            }`}
                          >
                            <IconComponent className="w-4 h-4" />
                            {view.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {chartView === 'timeline' && <TimelineChart />}
                  {chartView === 'breakdown' && <BreakdownChart />}
                  {chartView === 'comparison' && <ComparisonTable />}
                </div>

                {/* Benefits & Risk Assessment */}
                <div className="grid lg:grid-cols-2 gap-8">
                  {/* Benefits */}
                  <div className="bg-white rounded-xl p-6 shadow-lg">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      الفوائد المتوقعة
                    </h3>
                    <div className="space-y-4">
                      {[
                        { label: 'تقليل الأخطاء الطبية', value: results.benefits.errorReduction * 100, color: 'green' },
                        { label: 'توفير وقت الطاقم الطبي', value: results.benefits.timeReduction * 100, color: 'blue' },
                        { label: 'تحسين رضا المرضى', value: results.benefits.patientSatisfaction * 100, color: 'purple' },
                        { label: 'زيادة الكفاءة التشغيلية', value: results.benefits.efficiencyGain * 100, color: 'orange' }
                      ].map((benefit, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">{benefit.label}</span>
                            <span className={`text-sm font-bold text-${benefit.color}-600`}>
                              {benefit.value.toFixed(0)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full bg-${benefit.color}-500`}
                              style={{ width: `${benefit.value}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Risk Assessment */}
                  <div className="bg-white rounded-xl p-6 shadow-lg">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-600" />
                      تقييم المخاطر
                    </h3>
                    <div className="space-y-4">
                      {[
                        { label: 'مخاطر التنفيذ', risk: results.riskFactors.implementation },
                        { label: 'مخاطر الاسترداد', risk: results.riskFactors.payback },
                        { label: 'تعقيد المشروع', risk: results.riskFactors.complexity }
                      ].map((item, index) => {
                        const IconComponent = getRiskIcon(item.risk);
                        return (
                          <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                            <span className="font-medium">{item.label}</span>
                            <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${getRiskColor(item.risk)}`}>
                              <IconComponent className="w-4 h-4" />
                              <span className="text-sm font-medium">
                                {item.risk === 'low' ? 'منخفضة' : item.risk === 'medium' ? 'متوسطة' : 'عالية'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <div className="grid md:grid-cols-3 gap-4">
                    <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2">
                      <Download className="w-4 h-4" />
                      تحميل التقرير PDF
                    </button>
                    <button 
                      onClick={() => window.open('https://calendly.com/fadil369', '_blank')}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Calendar className="w-4 h-4" />
                      احجز عرض تجريبي
                    </button>
                    <button 
                      onClick={() => window.open('mailto:dr.mf.12298@gmail.com', '_blank')}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Mail className="w-4 h-4" />
                      تواصل معنا
                    </button>
                  </div>
                </div>
              </div>
            )}

            {currentStep < 3 && (
              <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
                <Calculator className="w-16 h-16 text-purple-600 mx-auto mb-6" />
                <h2 className="text-2xl font-bold text-gray-800 mb-4">أكمل المعلومات المطلوبة</h2>
                <p className="text-gray-600">املأ جميع الحقول المطلوبة للحصول على تحليل دقيق لعائد الاستثمار</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .font-arabic {
          font-family: 'Tajawal', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
      `}</style>
    </div>
  );
};

export default BrainSAITROICalculator;