/* 数列模块内容（Task 5/6）：8 节点 + 16 方法卡 */
(function () {
  var M = '数列';
  window.DATA.nodes.push(
    {id:'s1',module:M,title:'数列概念与通项',brief:'数列、通项公式、递推与单调性',req:'理解数列概念，会由通项公式求项，会判断数列的单调性。',prereq:[],methods:['sm1'],diff:'基础'},
    {id:'s2',module:M,title:'等差数列',brief:'通项、性质与前 n 项和',req:'掌握等差数列的通项公式、性质与前 n 项和公式。',prereq:['s1'],methods:['sm2','sm3'],diff:'基础'},
    {id:'s3',module:M,title:'等比数列',brief:'通项、性质与前 n 项和',req:'掌握等比数列的通项公式、性质与前 n 项和公式，注意公比讨论。',prereq:['s1'],methods:['sm4','sm5'],diff:'中档'},
    {id:'s4',module:M,title:'通项公式的求法',brief:'累加、累积、构造等比',req:'会用累加法、累积法与构造法由递推式求通项。',prereq:['s2','s3'],methods:['sm6','sm7'],diff:'中档'},
    {id:'s5',module:M,title:'前 n 项和与错位相减',brief:'等差×等比型求和',req:'会用错位相减法求等差与等比对应项之积的和。',prereq:['s2','s3'],methods:['sm8'],diff:'中档'},
    {id:'s6',module:M,title:'裂项相消与分组求和',brief:'分式型求和、通项分组',req:'会用裂项相消与分组求和解决数列求和问题。',prereq:['s1'],methods:['sm9','sm10'],diff:'中档'},
    {id:'s7',module:M,title:'数列与不等式',brief:'最值、单调性、放缩证明',req:'会求数列的最值，会用放缩法证明数列不等式。',prereq:['s5','s6'],methods:['sm11','sm12','sm13'],diff:'压轴'},
    {id:'s8',module:M,title:'数学归纳法与递推综合',brief:'归纳法、奇偶项、实际应用',req:'掌握数学归纳法，能处理奇偶项讨论与数列实际应用问题。',prereq:['s4'],methods:['sm14','sm15','sm16'],diff:'压轴'}
  );
  window.DATA.methods.push(
    {id:'sm1',module:M,node:'s1',title:'由通项公式求项与判单调',trigger:'已知 aₙ 的表达式，求某项或判断增减',steps:['把 n 代入通项求值','比较 aₙ₊₁ 与 aₙ 的大小','下结论：差为正则递增'],formula:'aₙ = f(n)',mistake:'把“第几项”与 n 的取值对应错',diff:'基础'},
    {id:'sm2',module:M,node:'s2',title:'等差数列基本量法',trigger:'已知等差中若干条件求通项或和',steps:['设首项 a₁ 与公差 d','用条件列方程组求解','写出通项与前 n 项和'],formula:'aₙ = a₁ + (n−1)d',mistake:'项数 n 与条件个数对应错',diff:'基础'},
    {id:'sm3',module:M,node:'s2',title:'等差数列性质应用',trigger:'下标和相等或涉及中项',steps:['用 m+n = p+q ⇒ aₘ+aₙ = aₚ+a_q','用中项 2aₙ = aₙ₋₁ + aₙ₊₁','整体求值，避免解出每一项'],formula:'m+n=p+q ⇒ aₘ+aₙ=aₚ+a_q',mistake:'把性质的条件记错',diff:'基础'},
    {id:'sm4',module:M,node:'s3',title:'等比数列基本量法',trigger:'已知等比中若干条件',steps:['设首项 a₁ 与公比 q','用条件列方程求解（注意 q 的正负）','写出通项公式'],formula:'aₙ = a₁qⁿ⁻¹',mistake:'忽略公比为负数或 1 的可能',diff:'中档'},
    {id:'sm5',module:M,node:'s3',title:'等比数列前 n 项和',trigger:'求和或已知 Sₙ 反求参数',steps:['先讨论 q = 1 的情形','q ≠ 1 时套求和公式','整理成便于比较的形式'],formula:'Sₙ = a₁(1−qⁿ)/(1−q)',mistake:'漏掉 q = 1 的讨论',diff:'中档'},
    {id:'sm6',module:M,node:'s4',title:'累加法求通项',trigger:'递推形如 aₙ₊₁ − aₙ = f(n)',steps:['把 n 从 1 到 n−1 的式子累加','左边合成 aₙ − a₁','求右边和并化简'],formula:'aₙ = a₁ + Σf(k)',mistake:'累加时项数多算或少算一项',diff:'中档'},
    {id:'sm7',module:M,node:'s4',title:'构造等比求通项',trigger:'递推形如 aₙ₊₁ = p·aₙ + q',steps:['设 aₙ₊₁ + λ = p(aₙ + λ)','解出 λ','化为等比数列后求通项'],formula:'λ = q/(p−1)',mistake:'λ 的符号或分母算错',diff:'中档'},
    {id:'sm8',module:M,node:'s5',title:'错位相减法求和',trigger:'通项是“等差×等比”的形式',steps:['写出 Sₙ 的展开式','两边乘公比后错位对齐','两式相减并化简'],formula:'Sₙ − qSₙ',mistake:'相减时错位没有对齐',diff:'压轴'},
    {id:'sm9',module:M,node:'s6',title:'裂项相消求和',trigger:'通项形如 1/(n(n+k))',steps:['把通项拆成两个分式之差','逐项相加，中间项相消','整理首尾剩余项'],formula:'1/(n(n+1)) = 1/n − 1/(n+1)',mistake:'漏掉前面的系数 1/k',diff:'中档'},
    {id:'sm10',module:M,node:'s6',title:'分组求和',trigger:'通项由等差、等比等几部分组成',steps:['把通项拆成几个可求和的部分','分别用对应公式求和','相加得到结果'],formula:'分组求和',mistake:'拆分时漏项或错项',diff:'中档'},
    {id:'sm11',module:M,node:'s7',title:'数列单调性与最值',trigger:'求最大项、最小项',steps:['比较 aₙ₊₁ − aₙ 的符号','找符号由正变负的转折点','得出最大项或最小项'],formula:'aₙ₊₁ − aₙ 的符号',mistake:'只算相邻两项就下结论',diff:'压轴'},
    {id:'sm12',module:M,node:'s7',title:'数列不等式放缩',trigger:'证明与和式有关的不等式',steps:['把通项放大或缩小成可求和的形式','求和后与目标比较','检查放缩方向是否一致'],formula:'放缩成裂项或等比形式',mistake:'放缩过度导致结论不成立',diff:'压轴'},
    {id:'sm13',module:M,node:'s7',title:'递推与不等式综合',trigger:'递推式与不等式同时出现',steps:['由递推估计数列的范围','用数学归纳法或单调性证明','下结论'],formula:'归纳假设',mistake:'归纳步骤不完整',diff:'压轴'},
    {id:'sm14',module:M,node:'s8',title:'数学归纳法',trigger:'命题与正整数 n 有关',steps:['验证 n = 1 时成立','假设 n = k 成立','推证 n = k+1 成立','下结论'],formula:'归纳三步骤',mistake:'推导 k+1 时没有用上归纳假设',diff:'压轴'},
    {id:'sm15',module:M,node:'s8',title:'奇偶项讨论',trigger:'通项含 (−1)ⁿ 或需按奇偶求和',steps:['分 n 为奇数、偶数两种情况','分别求和或求通项','合并写成分段形式'],formula:'分类求和',mistake:'奇偶项的项数算错',diff:'压轴'},
    {id:'sm16',module:M,node:'s8',title:'数列实际应用',trigger:'增长率、分期付款、累计问题',steps:['判断是等差还是等比模型','确定首项与公比（或公差）的含义','求通项与前 n 项和并回答实际问题'],formula:'等比增长 / 等差增长',mistake:'首项对应的初始时刻搞错',diff:'压轴'}
  );
  window.DATA.questions.push(
    {id:'sq1',module:'数列',node:'s1',methods:['sm1'],diff:'基础',type:'fill',stem:'已知 aₙ=2n+1，求 a₅。',answer:'11',steps:'a₅=2×5+1=11。',source:'自编'},
    {id:'sq2',module:'数列',node:'s1',methods:['sm1'],diff:'基础',type:'fill',stem:'写出数列 1,4,9,16,… 的通项公式。',answer:'n²',steps:'每项是对应项号的平方。',source:'自编'},
    {id:'sq3',module:'数列',node:'s2',methods:['sm2'],diff:'基础',type:'fill',stem:'等差数列 a₁=2，d=3，求 a₁₀。',answer:'29',steps:'a₁₀=2+9×3=29。',source:'自编'},
    {id:'sq4',module:'数列',node:'s2',methods:['sm2'],diff:'基础',type:'fill',stem:'求等差数列 3,7,11,… 的前 5 项和。',answer:'55',steps:'a₅=19，S₅=5×(3+19)/2=55。',source:'自编'},
    {id:'sq5',module:'数列',node:'s3',methods:['sm4'],diff:'基础',type:'fill',stem:'等比数列 a₁=2，q=3，求 a₄。',answer:'54',steps:'a₄=2×3³=54。',source:'自编'},
    {id:'sq6',module:'数列',node:'s3',methods:['sm5'],diff:'基础',type:'choice',stem:'等比数列 1,2,4,8,… 的前 5 项和是：',options:['15','31','63','16'],answer:'B',steps:'1+2+4+8+16=31。',source:'自编'},
    {id:'sq7',module:'数列',node:'s2',methods:['sm2'],diff:'基础',type:'choice',stem:'等差数列 1,3,5,7,… 的通项公式是：',options:['aₙ=2n-1','aₙ=2n+1','aₙ=n+1','aₙ=3n-2'],answer:'A',steps:'a₁=1，d=2，aₙ=2n-1。',source:'自编'},
    {id:'sq8',module:'数列',node:'s3',methods:['sm4'],diff:'基础',type:'fill',stem:'求等比数列 2,6,18,… 的公比。',answer:'3',steps:'q=6÷2=3。',source:'自编'},
    {id:'sq9',module:'数列',node:'s2',methods:['sm2'],diff:'中档',type:'solution',stem:'等差数列中 a₃=7，a₇=19，求 a₁ 与公差 d。',answer:'a₁=1，d=3',steps:'a₇-a₃=4d=12，d=3；a₁=a₃-2d=1。',source:'自编'},
    {id:'sq10',module:'数列',node:'s2',methods:['sm2'],diff:'中档',type:'solution',stem:'等差数列 a₁=1，S₁₀=100，求公差 d。',answer:'d=2',steps:'S₁₀=10a₁+45d=10+45d=100，d=2。',source:'自编'},
    {id:'sq11',module:'数列',node:'s3',methods:['sm4'],diff:'中档',type:'solution',stem:'等比数列中 a₂=6，a₅=48，求 a₁ 与公比 q。',answer:'a₁=3，q=2',steps:'a₅/a₂=q³=8，q=2；a₁=a₂/q=3。',source:'自编'},
    {id:'sq12',module:'数列',node:'s3',methods:['sm5'],diff:'中档',type:'solution',stem:'等比数列 a₁=1，q=2，求 S₈。',answer:'255',steps:'S₈=(2⁸-1)/(2-1)=255。',source:'自编'},
    {id:'sq13',module:'数列',node:'s4',methods:['sm6'],diff:'中档',type:'solution',stem:'已知 a₁=1，aₙ₊₁=aₙ+2n，求 aₙ。',answer:'n²-n+1',steps:'累加得 aₙ=a₁+2(1+2+…+(n-1))=1+n(n-1)=n²-n+1。',source:'改编'},
    {id:'sq14',module:'数列',node:'s4',methods:['sm7'],diff:'中档',type:'solution',stem:'已知 a₁=1，aₙ₊₁=2aₙ+1，求 aₙ。',answer:'2ⁿ-1',steps:'构造 aₙ₊₁+1=2(aₙ+1)，得 aₙ+1=2ⁿ，故 aₙ=2ⁿ-1。',source:'改编'},
    {id:'sq15',module:'数列',node:'s4',methods:['sm6'],diff:'中档',type:'fill',stem:'已知 a₁=2，aₙ₊₁=aₙ+3，求 aₙ。',answer:'3n-1',steps:'等差，aₙ=2+3(n-1)=3n-1。',source:'自编'},
    {id:'sq16',module:'数列',node:'s5',methods:['sm8'],diff:'中档',type:'solution',stem:'求 Sₙ=Σ(k·2ᵏ)（k 从 1 到 n）。',answer:'(n-1)2^(n+1)+2',steps:'错位相减：Sₙ-2Sₙ=2+2²+…+2ⁿ-n·2ⁿ⁺¹，化简得结果。',source:'改编'},
    {id:'sq17',module:'数列',node:'s6',methods:['sm9'],diff:'中档',type:'solution',stem:'求 Σ1/(k(k+1))（k 从 1 到 n）。',answer:'n/(n+1)',steps:'裂项：1/(k(k+1))=1/k-1/(k+1)，相消后得 1-1/(n+1)。',source:'自编'},
    {id:'sq18',module:'数列',node:'s6',methods:['sm10'],diff:'中档',type:'fill',stem:'数列 aₙ=2n+3ⁿ，求前 n 项和。',answer:'n²+n+(3^(n+1)-3)/2',steps:'分组求和：等差数列部分为 n²+n，等比部分为 (3ⁿ⁺¹-3)/2。',source:'改编'},
    {id:'sq19',module:'数列',node:'s7',methods:['sm11'],diff:'中档',type:'solution',stem:'数列 aₙ=n²-10n+24，求它的最小项。',answer:'第 5 项，a₅=-1',steps:'对称轴 n=5，a₅=25-50+24=-1。',source:'改编'},
    {id:'sq20',module:'数列',node:'s7',methods:['sm11'],diff:'中档',type:'solution',stem:'证明数列 aₙ=1/n 是递减数列。',answer:'略',steps:'aₙ₊₁-aₙ=1/(n+1)-1/n=-1/(n(n+1))<0，故递减。',source:'自编'},
    {id:'sq21',module:'数列',node:'s8',methods:['sm14'],diff:'中档',type:'solution',stem:'用数学归纳法证明 1+2+…+n=n(n+1)/2。',answer:'略',steps:'n=1 成立；假设 n=k 成立，则 n=k+1 时两边各加 k+1，仍成立。',source:'自编'},
    {id:'sq22',module:'数列',node:'s2',methods:['sm2'],diff:'中档',type:'solution',stem:'等差数列的前 n 项和 Sₙ=3n²+2n，求 aₙ。',answer:'6n-1',steps:'aₙ=Sₙ-Sₙ₋₁=3n²+2n-[3(n-1)²+2(n-1)]=6n-1。',source:'改编'},
    {id:'sq23',module:'数列',node:'s3',methods:['sm4'],diff:'中档',type:'fill',stem:'等比数列 a₁=1，q=-2，求 a₅。',answer:'16',steps:'a₅=1×(-2)⁴=16。',source:'自编'},
    {id:'sq24',module:'数列',node:'s6',methods:['sm9'],diff:'中档',type:'solution',stem:'求 Σ1/((2k-1)(2k+1))（k 从 1 到 n）。',answer:'n/(2n+1)',steps:'裂项为 ½[1/(2k-1)-1/(2k+1)]，相消得 ½(1-1/(2n+1))=n/(2n+1)。',source:'改编'},
    {id:'sq25',module:'数列',node:'s7',methods:['sm12'],diff:'压轴',type:'solution',stem:'已知 aₙ=2n-1，证明 1/(a₁a₂)+1/(a₂a₃)+…+1/(aₙaₙ₊₁)<1/2。',answer:'略',steps:'裂项 1/((2k-1)(2k+1))=½(1/(2k-1)-1/(2k+1))，和为 ½(1-1/(2n+1))<½。',source:'改编'},
    {id:'sq26',module:'数列',node:'s5',methods:['sm8'],diff:'压轴',type:'solution',stem:'数列 aₙ=n·2ⁿ，求前 n 项和 Sₙ。',answer:'(n-1)2^(n+1)+2',steps:'错位相减：Sₙ-2Sₙ=2+2²+…+2ⁿ-n·2ⁿ⁺¹，整理即得。',source:'改编'},
    {id:'sq27',module:'数列',node:'s8',methods:['sm14'],diff:'压轴',type:'solution',stem:'证明当 n≥5 时，2ⁿ>n²。',answer:'略',steps:'n=5 时 32>25 成立；假设 n=k 成立，则 2ᵏ⁺¹=2·2ᵏ>2k²，而 2k²>(k+1)² 当 k≥3 时成立，故归纳成立。',source:'改编'},
    {id:'sq28',module:'数列',node:'s8',methods:['sm15'],diff:'压轴',type:'solution',stem:'数列 aₙ=(-1)ⁿ·n，求 S₁₀₀。',answer:'50',steps:'每两项一组：(-1+2)=1，共 50 组，和为 50。',source:'改编'},
    {id:'sq29',module:'数列',node:'s7',methods:['sm11'],diff:'压轴',type:'solution',stem:'已知 Sₙ=n²+n，求 aₙ 并判断其单调性。',answer:'aₙ=2n，递增',steps:'aₙ=Sₙ-Sₙ₋₁=2n；aₙ₊₁-aₙ=2>0，递增。',source:'改编'},
    {id:'sq30',module:'数列',node:'s8',methods:['sm16'],diff:'压轴',type:'solution',stem:'等比数列 a₁=1，q=2，求使 Sₙ>1000 的最小 n。',answer:'n=10',steps:'S₉=511<1000，S₁₀=1023>1000，故最小 n=10。',source:'改编'},
    {id:'sq31',module:'数列',node:'s4',methods:['sm4'],diff:'压轴',type:'solution',stem:'已知 a₁=1，aₙ₊₁=3aₙ，求 aₙ 与 S₅。',answer:'aₙ=3^(n-1)，S₅=121',steps:'等比 a₁=1，q=3，aₙ=3ⁿ⁻¹；S₅=(3⁵-1)/2=121。',source:'自编'},
    {id:'sq32',module:'数列',node:'s7',methods:['sm12'],diff:'压轴',type:'solution',stem:'证明对任意正整数 n，1/1²+1/2²+…+1/n²<2。',answer:'略',steps:'k≥2 时 1/k²<1/(k(k-1))=1/(k-1)-1/k，裂项相消得和<1+1-1/n<2。',source:'改编'}
  );
})();
