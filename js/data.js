/* 内容库：函数与导数（新高考全国卷）
   知识边界参考教育部《普通高中课程方案和课程标准（2017 年版 2020 年修订）》数学主题；
   例题为自编/改编，标注来源，不含受版权保护的真题原文。 */
window.DATA = (function () {
  var nodes = [
    {id:'n1',module:'函数与导数',title:'函数的概念与表示',brief:'函数的三要素、表示法、分段函数',req:'理解函数概念，会求定义域，能用解析法、图象法、列表法表示函数。',prereq:[],methods:['m1'],diff:'基础'},
    {id:'n2',module:'函数与导数',title:'定义域与值域',brief:'常见限制条件、配方法与值域',req:'会求简单函数的定义域与值域，理解值域由定义域和对应关系共同决定。',prereq:['n1'],methods:['m2'],diff:'基础'},
    {id:'n3',module:'函数与导数',title:'函数的单调性',brief:'单调性判定、复合函数同增异减',req:'理解单调性，会用定义和导数判断单调性，掌握复合函数单调性。',prereq:['n1'],methods:['m3','m4'],diff:'中档'},
    {id:'n4',module:'函数与导数',title:'奇偶性与周期性',brief:'对称性、周期条件与求值',req:'理解奇偶性和周期性，会判断并用于求值与图象。',prereq:['n1'],methods:['m5','m6'],diff:'中档'},
    {id:'n5',module:'函数与导数',title:'指数函数与对数函数',brief:'运算、单调性与比较大小',req:'掌握指数、对数运算，理解两类函数的图象与单调性。',prereq:['n1'],methods:['m7','m8'],diff:'中档'},
    {id:'n6',module:'函数与导数',title:'函数图象与变换',brief:'平移、伸缩、对称、数形结合',req:'会作函数图象，掌握平移、伸缩、对称变换，会用图象研究性质。',prereq:['n1'],methods:['m9','m10','m24'],diff:'中档'},
    {id:'n7',module:'函数与导数',title:'导数概念与几何意义',brief:'导数定义、切线方程',req:'理解导数定义与几何意义，会求切线方程。',prereq:['n1','n6'],methods:['m11','m12'],diff:'中档'},
    {id:'n8',module:'函数与导数',title:'导数与单调性',brief:'求单调区间、含参讨论',req:'会用导数判断单调性，能对含参问题分类讨论。',prereq:['n7','n3'],methods:['m13','m14'],diff:'中档'},
    {id:'n9',module:'函数与导数',title:'极值与最值',brief:'极值判定、闭区间最值',req:'会用导数求极值与闭区间最值，理解极值与最值的区别。',prereq:['n8'],methods:['m15','m16'],diff:'中档'},
    {id:'n10',module:'函数与导数',title:'零点与方程根',brief:'零点存在定理、根的个数',req:'理解函数零点与方程根的关系，会用图象与导数讨论根的个数。',prereq:['n8','n6'],methods:['m17','m23'],diff:'中档'},
    {id:'n11',module:'函数与导数',title:'恒成立与存在性（参数）',brief:'分离参数、最值法、∀与∃',req:'会解决含参恒成立与存在性问题，掌握分离参数与最值法。',prereq:['n9','n10'],methods:['m18','m19','m22'],diff:'压轴'},
    {id:'n12',module:'函数与导数',title:'导数与不等式证明',brief:'构造函数、极值点偏移',req:'能构造函数证明不等式，处理双变量与极值点偏移问题。',prereq:['n9','n11'],methods:['m20','m21'],diff:'压轴'}
  ];

  var methods = [
    {id:'m1',module:'函数与导数',title:'定义域求解',node:'n1',trigger:'分式、偶次根式、对数、零次幂同时出现',steps:['分母不为 0；偶次根式被开方数 ≥ 0','对数真数 > 0，底数 > 0 且 ≠ 1','把所有限制写成不等式（组）取交集'],formula:'定义域 = 各限制条件的交集',mistake:'漏掉真数 > 0，或忘记取交集',diff:'基础'},
    {id:'m2',module:'函数与导数',title:'配方法求值域',node:'n2',trigger:'二次函数或可配方化成二次的式子',steps:['配方成 a(x-h)²+k','看开口方向和定义域','结合对称轴与端点取最值'],formula:'y = a(x-h)² + k',mistake:'忽略定义域，直接取顶点',diff:'基础'},
    {id:'m3',module:'函数与导数',title:'定义法证单调',node:'n3',trigger:'证明单调性或含抽象函数',steps:['设 x₁ < x₂，且都在区间内','作差 f(x₂) − f(x₁)','变形定号，下结论'],formula:'增：f(x₂) − f(x₁) > 0',mistake:'未说明 x₁、x₂ 在给定区间内',diff:'中档'},
    {id:'m4',module:'函数与导数',title:'复合函数单调性',node:'n3',trigger:'函数形如 f(g(x))',steps:['拆成内层 u=g(x) 与外层 y=f(u)','分别判断两层单调性','按“同增异减”下结论'],formula:'同增异减',mistake:'忽略内层值域与外层定义域',diff:'中档'},
    {id:'m5',module:'函数与导数',title:'奇偶性判定三步',node:'n4',trigger:'判断奇偶性或求参数',steps:['先看定义域是否关于原点对称','计算 f(−x)','比较 f(−x) 与 ±f(x)'],formula:'奇：f(−x)=−f(x)；偶：f(−x)=f(x)',mistake:'不先检查定义域对称性',diff:'基础'},
    {id:'m6',module:'函数与导数',title:'周期性求值',node:'n4',trigger:'出现 f(x+T)=f(x) 或对称条件',steps:['确定周期 T','把大自变量化到已知区间','代入求值'],formula:'f(x+T)=f(x)',mistake:'周期倍数算错或将对称误当周期',diff:'中档'},
    {id:'m7',module:'函数与导数',title:'指对比较大小',node:'n5',trigger:'比较幂、对数的大小',steps:['先与 0、1 比较分档','同底用单调性','不同底找中间量搭桥'],formula:'0<a<1 递减；a>1 递增',mistake:'忽略底数范围导致单调性方向错',diff:'中档'},
    {id:'m8',module:'函数与导数',title:'指对运算化简',node:'n5',trigger:'指数、对数混合运算式',steps:['统一底数','用运算律合并','必要时换元简化'],formula:'log_a(MN)=log_aM+log_aN',mistake:'忘记真数必须大于 0',diff:'基础'},
    {id:'m9',module:'函数与导数',title:'图象变换',node:'n6',trigger:'平移、伸缩、对称',steps:['对 x 左加右减','对 y 上加下减','伸缩系数作用在 x 上'],formula:'y=f(x) 左移 a → y=f(x+a)',mistake:'平移方向记反',diff:'基础'},
    {id:'m10',module:'函数与导数',title:'由图象求解析式',node:'n6',trigger:'给出图象求 f(x)',steps:['先判断函数类型','找顶点、特殊点、渐近线','代点列方程求参数'],formula:'待定系数法',mistake:'只凭一个点就确定参数',diff:'中档'},
    {id:'m11',module:'函数与导数',title:'导数定义式求值',node:'n7',trigger:'出现 lim [f(x₀+Δx)−f(x₀)]/Δx',steps:['把式子凑成导数定义的形式','识别它等于 f′(x₀)','代值计算'],formula:'f′(x₀)=lim(Δx→0) Δy/Δx',mistake:'分子分母没有配套凑形',diff:'基础'},
    {id:'m12',module:'函数与导数',title:'切线方程（在点/过点）',node:'n7',trigger:'求切线或已知切线求参',steps:['求导函数','“在点”直接求 k=f′(x₀)','“过点”先设切点再解方程','点斜式写方程'],formula:'k=f′(x₀)，y−y₀=k(x−x₀)',mistake:'“过点”当成切点直接代入',diff:'中档'},
    {id:'m13',module:'函数与导数',title:'用导数求单调区间',node:'n8',trigger:'求单调区间',steps:['先求定义域','求 f′ 并因式分解','解 f′>0 与 f′<0','写区间（不能用并集连接）'],formula:'f′>0 增；f′<0 减',mistake:'单调区间用“∪”连接',diff:'中档'},
    {id:'m14',module:'函数与导数',title:'含参单调性讨论',node:'n8',trigger:'f′(x) 含参数',steps:['求 f′，解 f′=0','按根的大小、是否在定义域内分类','列表判断符号','分别写结论'],formula:'分类讨论',mistake:'分类不全，漏掉参数为 0 或根相等等情况',diff:'压轴'},
    {id:'m15',module:'函数与导数',title:'极值求法',node:'n9',trigger:'求极值',steps:['求 f′，解 f′=0 得驻点','看驻点左右 f′ 是否变号','左正右负为极大，左负右正为极小','代入求值'],formula:'变号才取极值',mistake:'f′=0 就当成极值点',diff:'中档'},
    {id:'m16',module:'函数与导数',title:'闭区间最值',node:'n9',trigger:'求 [a,b] 上的最值',steps:['求 f′，找区间内驻点','比较所有驻点与两个端点的函数值','取最大与最小'],formula:'最值在驻点或端点取得',mistake:'漏比较端点值',diff:'中档'},
    {id:'m17',module:'函数与导数',title:'零点存在性与个数',node:'n10',trigger:'判断零点存在或根的个数',steps:['说明函数连续','端点异号 ⇒ 存在零点','再结合单调性确定个数'],formula:'f(a)·f(b)<0',mistake:'只证存在却当作唯一',diff:'中档'},
    {id:'m18',module:'函数与导数',title:'分离参数求范围',node:'n11',trigger:'恒成立或有解求参数范围',steps:['把参数分离到一边','求另一边函数的最值','恒成立取最值，有解取值域'],formula:'a≥f(x) 恒成立 ⇔ a≥f_max',mistake:'≥ 与 > 的取等条件混淆',diff:'压轴'},
    {id:'m19',module:'函数与导数',title:'恒成立与存在性转化',node:'n11',trigger:'题目出现“恒成立/存在”',steps:['恒成立：转化为最值','存在：转化为值域','分清 ∀ 与 ∃ 的区别'],formula:'∀：a≥f_max；∃：a≥f_min',mistake:'把恒成立与存在性条件写反',diff:'压轴'},
    {id:'m20',module:'函数与导数',title:'构造函数证不等式',node:'n12',trigger:'证明 f(x)≥g(x)',steps:['移项构造 h(x)=f(x)−g(x)','求 h′，分析单调性','求 h 的最小值','证明最小值 ≥ 0'],formula:'h_min ≥ 0',mistake:'构造后不交代定义域',diff:'压轴'},
    {id:'m21',module:'函数与导数',title:'极值点偏移',node:'n12',trigger:'双变量或两个零点比较大小',steps:['设 x₁<x₂，利用单调性','构造关于中点的对称函数','比较对称点处函数值','推出 x₁+x₂ 与 2x₀ 的大小'],formula:'对称化构造',mistake:'直接作差无法判断符号',diff:'压轴'},
    {id:'m22',module:'函数与导数',title:'恒成立的最值法',node:'n11',trigger:'含参恒成立且不易分离参数',steps:['求 f(x) 的最小值（含参）','令最小值 ≥ 0','解关于参数的不等式'],formula:'f_min ≥ 0',mistake:'参数影响最值位置却没讨论',diff:'压轴'},
    {id:'m23',module:'函数与导数',title:'分段函数与零点',node:'n10',trigger:'分段函数、绝对值函数求零点',steps:['按分段写出表达式','每段分别求零点','验证零点是否落在该段','合并所有解'],formula:'分段讨论',mistake:'忘记验证零点所属区间',diff:'中档'},
    {id:'m24',module:'函数与导数',title:'参数与图象综合',node:'n6',trigger:'方程根的个数、参数范围',steps:['把方程化为两个函数相等','分别作出图象','数交点个数','由交点个数确定参数范围'],formula:'数形结合',mistake:'关键点（极值、端点）没标清',diff:'压轴'}
  ];

  var questions = [
    {id:'q1',module:'函数与导数',node:'n1',methods:['m1'],diff:'基础',type:'fill',stem:'已知 f(x)=x²+1，求 f(2)。',answer:'5',steps:'f(2)=2²+1=5。',source:'自编'},
    {id:'q2',module:'函数与导数',node:'n1',methods:['m1'],diff:'基础',type:'fill',stem:'已知 f(x)=2x−3，若 f(a)=7，求 a。',answer:'5',steps:'2a−3=7，解得 a=5。',source:'自编'},
    {id:'q3',module:'函数与导数',node:'n2',methods:['m1'],diff:'基础',type:'choice',stem:'函数 f(x)=1/(x−2) 的定义域是：',options:['x≠2','x>2','x≥2','全体实数'],answer:'A',steps:'分母不为 0，即 x−2≠0，x≠2。',source:'自编'},
    {id:'q4',module:'函数与导数',node:'n2',methods:['m1'],diff:'基础',type:'fill',stem:'函数 f(x)=√(x−1) 的定义域是（用不等式表示）。',answer:'x≥1',steps:'被开方数 x−1≥0，得 x≥1。',source:'自编'},
    {id:'q5',module:'函数与导数',node:'n2',methods:['m2'],diff:'基础',type:'fill',stem:'求 f(x)=x²−2x+3 的最小值。',answer:'2',steps:'配方得 (x−1)²+2，最小值 2。',source:'自编'},
    {id:'q6',module:'函数与导数',node:'n3',methods:['m3'],diff:'基础',type:'choice',stem:'f(x)=x²−2x 的单调递增区间是：',options:['(−∞,1]','[1,+∞)','(−∞,0]','[0,+∞)'],answer:'B',steps:'对称轴 x=1，开口向上，[1,+∞) 递增。',source:'自编'},
    {id:'q7',module:'函数与导数',node:'n3',methods:['m3'],diff:'基础',type:'fill',stem:'f(x)=2x+1 在 R 上单调递____（填“增”或“减”）。',answer:'增',steps:'一次项系数 2>0，故递增。',source:'自编'},
    {id:'q8',module:'函数与导数',node:'n4',methods:['m5'],diff:'基础',type:'choice',stem:'f(x)=x³ 的奇偶性是：',options:['奇函数','偶函数','非奇非偶','既奇又偶'],answer:'A',steps:'f(−x)=(−x)³=−x³=−f(x)，为奇函数。',source:'自编'},
    {id:'q9',module:'函数与导数',node:'n4',methods:['m5'],diff:'基础',type:'fill',stem:'f(x) 是偶函数且 f(3)=9，求 f(−3)。',answer:'9',steps:'偶函数满足 f(−x)=f(x)。',source:'自编'},
    {id:'q10',module:'函数与导数',node:'n5',methods:['m8'],diff:'基础',type:'fill',stem:'计算 log₂8。',answer:'3',steps:'2³=8，故 log₂8=3。',source:'自编'},
    {id:'q11',module:'函数与导数',node:'n6',methods:['m9'],diff:'基础',type:'choice',stem:'把 y=x² 的图象向右平移 1 个单位，所得解析式为：',options:['y=(x+1)²','y=(x−1)²','y=x²+1','y=x²−1'],answer:'B',steps:'右移 1 个单位：x 换成 x−1。',source:'自编'},
    {id:'q12',module:'函数与导数',node:'n7',methods:['m12'],diff:'基础',type:'fill',stem:'f(x)=x² 在 x=1 处的切线斜率为？',answer:'2',steps:'f′(x)=2x，f′(1)=2。',source:'自编'},

    {id:'q13',module:'函数与导数',node:'n2',methods:['m1'],diff:'中档',type:'choice',stem:'f(x)=lg(x−1)/(x−3) 的定义域是：',options:['x>1','x>1 且 x≠3','x>3','x≠3'],answer:'B',steps:'真数 x−1>0 且分母 x−3≠0。',source:'自编'},
    {id:'q14',module:'函数与导数',node:'n2',methods:['m2'],diff:'中档',type:'solution',stem:'求 f(x)=x+1/x（x>0）的最小值。',answer:'2',steps:'由基本不等式 x+1/x≥2，当 x=1 时取等，最小值为 2。',source:'改编'},
    {id:'q15',module:'函数与导数',node:'n3',methods:['m3'],diff:'中档',type:'solution',stem:'证明 f(x)=x³ 在 R 上单调递增。',answer:'递增',steps:'设 x₁<x₂，则 x₂³−x₁³=(x₂−x₁)(x₂²+x₂x₁+x₁²)>0，故递增。',source:'自编'},
    {id:'q16',module:'函数与导数',node:'n3',methods:['m4'],diff:'中档',type:'fill',stem:'求 f(x)=log₂(x²−2x) 的单调递增区间。',answer:'(2,+∞)',steps:'令 u=x²−2x>0；u 在 (2,+∞) 递增，外层 log₂u 递增，同增。',source:'改编'},
    {id:'q17',module:'函数与导数',node:'n4',methods:['m5'],diff:'中档',type:'solution',stem:'判断 f(x)=x+1/x 的奇偶性。',answer:'奇函数',steps:'定义域 x≠0 关于原点对称，且 f(−x)=−x−1/x=−f(x)。',source:'自编'},
    {id:'q18',module:'函数与导数',node:'n5',methods:['m7'],diff:'中档',type:'choice',stem:'比较 a=2^0.3，b=0.3²，c=log₂0.3 的大小：',options:['a>b>c','b>a>c','a>c>b','c>a>b'],answer:'A',steps:'a>1，0<b<1，c<0，故 a>b>c。',source:'改编'},
    {id:'q19',module:'函数与导数',node:'n5',methods:['m8'],diff:'中档',type:'solution',stem:'解方程 2^(x+1)=16。',answer:'x=3',steps:'16=2⁴，故 x+1=4，x=3。',source:'自编'},
    {id:'q20',module:'函数与导数',node:'n6',methods:['m9'],diff:'中档',type:'solution',stem:'把 y=2^x 的图象先向左平移 1 个单位，再向上平移 2 个单位，求所得解析式。',answer:'y=2^(x+1)+2',steps:'左移 1：x→x+1；上移 2：整体 +2。',source:'自编'},
    {id:'q21',module:'函数与导数',node:'n7',methods:['m12'],diff:'中档',type:'choice',stem:'曲线 y=x³ 在点 (1,1) 处的切线方程是：',options:['y=3x−2','y=3x+2','y=x−1','y=2x−1'],answer:'A',steps:'y′=3x²，k=3，y−1=3(x−1)，即 y=3x−2。',source:'自编'},
    {id:'q22',module:'函数与导数',node:'n7',methods:['m12'],diff:'中档',type:'solution',stem:'求 y=ln x 在 x=1 处的切线方程。',answer:'y=x−1',steps:'y′=1/x，k=1；切点 (1,0)，y−0=1·(x−1)。',source:'自编'},
    {id:'q23',module:'函数与导数',node:'n8',methods:['m13'],diff:'中档',type:'choice',stem:'f(x)=x³−3x 的单调递减区间是：',options:['(−∞,−1)','(−1,1)','(1,+∞)','全体实数'],answer:'B',steps:'f′=3x²−3<0 ⇒ −1<x<1。',source:'自编'},
    {id:'q24',module:'函数与导数',node:'n8',methods:['m15'],diff:'中档',type:'fill',stem:'求 f(x)=x³−3x 的极大值。',answer:'2',steps:'f′=3x²−3=0 得 x=±1；x=−1 取极大，f(−1)=2。',source:'自编'},
    {id:'q25',module:'函数与导数',node:'n8',methods:['m13'],diff:'中档',type:'solution',stem:'求 f(x)=x³−3x²+2 的单调区间。',answer:'增(−∞,0)和(2,+∞)，减(0,2)',steps:'f′=3x²−6x=3x(x−2)，按符号讨论即得。',source:'自编'},
    {id:'q26',module:'函数与导数',node:'n8',methods:['m14'],diff:'中档',type:'solution',stem:'若 f(x)=x³+ax 在 R 上单调递增，求 a 的取值范围。',answer:'a≥0',steps:'f′=3x²+a≥0 对任意 x 成立，3x²≥0，故 a≥0。',source:'改编'},
    {id:'q27',module:'函数与导数',node:'n9',methods:['m15'],diff:'中档',type:'choice',stem:'f(x)=x³−3x 的极小值是：',options:['2','−2','0','−1'],answer:'B',steps:'x=1 取极小，f(1)=−2。',source:'自编'},
    {id:'q28',module:'函数与导数',node:'n9',methods:['m16'],diff:'中档',type:'fill',stem:'求 f(x)=x²−4x+1 在 [0,3] 上的最大值。',answer:'1',steps:'对称轴 x=2；f(0)=1，f(2)=−3，f(3)=−2，最大值为 1。',source:'自编'},
    {id:'q29',module:'函数与导数',node:'n9',methods:['m16'],diff:'中档',type:'solution',stem:'求 f(x)=x³−3x²+2 在 [0,3] 上的最大值与最小值。',answer:'最大2，最小−2',steps:'f′=3x²−6x；比较 f(0)=2，f(2)=−2，f(3)=2。',source:'自编'},
    {id:'q30',module:'函数与导数',node:'n10',methods:['m23'],diff:'中档',type:'choice',stem:'方程 x³−3x=0 的实根个数是：',options:['1','2','3','0'],answer:'C',steps:'x(x²−3)=0，三个实根。',source:'自编'},
    {id:'q31',module:'函数与导数',node:'n10',methods:['m17'],diff:'中档',type:'fill',stem:'函数 f(x)=ln x+x−3 的零点所在整数区间为 (n,n+1)，求 n。',answer:'2',steps:'f(2)=ln2−1<0，f(3)=ln3>0，故零点在 (2,3)。',source:'改编'},
    {id:'q32',module:'函数与导数',node:'n10',methods:['m23'],diff:'中档',type:'solution',stem:'讨论方程 x³−3x=a 的实根个数。',answer:'a<−2或a>2：1个；a=±2：2个；−2<a<2：3个',steps:'利用 f(x)=x³−3x 的图象：极大 2、极小 −2，按水平线 y=a 的交点讨论。',source:'改编'},
    {id:'q33',module:'函数与导数',node:'n11',methods:['m19'],diff:'中档',type:'choice',stem:'若 x²−2x+a≥0 对一切实数 x 恒成立，求 a 的范围：',options:['a≥1','a≤1','a≥−1','a≤−1'],answer:'A',steps:'判别式 Δ=4−4a≤0，得 a≥1。',source:'自编'},
    {id:'q34',module:'函数与导数',node:'n11',methods:['m18'],diff:'中档',type:'fill',stem:'若 a≥x²−2x 对 x∈[0,3] 恒成立，求 a 的最小值。',answer:'3',steps:'x²−2x 在 [0,3] 的最大值为 f(3)=3，故 a≥3。',source:'自编'},
    {id:'q35',module:'函数与导数',node:'n12',methods:['m20'],diff:'中档',type:'solution',stem:'证明 e^x≥x+1。',answer:'略',steps:'令 g(x)=e^x−x−1，g′=e^x−1，x=0 处取极小值 g(0)=0，故 g≥0。',source:'改编'},
    {id:'q36',module:'函数与导数',node:'n11',methods:['m22'],diff:'中档',type:'solution',stem:'若 f(x)=x²−2ax+1 在 [1,2] 上单调递增，求 a 的取值范围。',answer:'a≤1',steps:'对称轴 x=a，要使 [1,2] 在对称轴右侧，需 a≤1。',source:'自编'},

    {id:'q37',module:'函数与导数',node:'n11',methods:['m19'],diff:'压轴',type:'solution',stem:'若方程 x³−3x−a=0 有三个不相等的实根，求 a 的取值范围。',answer:'−2<a<2',steps:'f(x)=x³−3x 的极大值 2、极小值 −2；三个交点需 −2<a<2。',source:'改编'},
    {id:'q38',module:'函数与导数',node:'n12',methods:['m20'],diff:'压轴',type:'solution',stem:'证明当 x>0 时，ln x<x。',answer:'略',steps:'令 g(x)=x−ln x，g′=1−1/x，x=1 取极小值 g(1)=1>0，故 ln x<x。',source:'改编'},
    {id:'q39',module:'函数与导数',node:'n12',methods:['m20'],diff:'压轴',type:'solution',stem:'证明对任意实数 x，e^x≥ex。',answer:'略',steps:'令 g(x)=e^x−ex，g′=e^x−e，x=1 取极小值 g(1)=0，故 g≥0。',source:'改编'},
    {id:'q40',module:'函数与导数',node:'n9',methods:['m15'],diff:'压轴',type:'solution',stem:'讨论 f(x)=x³−3ax+1（a>0）的极值。',answer:'极大 2a√a+1，极小 −2a√a+1',steps:'f′=3x²−3a=0 得 x=±√a；代回求值得极大、极小。',source:'改编'},
    {id:'q41',module:'函数与导数',node:'n11',methods:['m22'],diff:'压轴',type:'solution',stem:'若 x²−2ax+1≥0 对 x∈[0,2] 恒成立，求 a 的取值范围。',answer:'a≤1',steps:'对称轴 x=a：a≤0 时最小值 f(0)=1≥0；0<a<2 时需 1−a²≥0；a≥2 时需 f(2)=5−4a≥0。综合得 a≤1。',source:'改编'},
    {id:'q42',module:'函数与导数',node:'n12',methods:['m20'],diff:'压轴',type:'solution',stem:'证明当 x>0 时，x−x²/2<ln(1+x)<x。',answer:'略',steps:'右边令 f=x−ln(1+x)，f′=x/(1+x)>0，f(0)=0；左边令 g=ln(1+x)−x+x²/2，g′=x²/(1+x)>0，g(0)=0。',source:'改编'},
    {id:'q43',module:'函数与导数',node:'n8',methods:['m14'],diff:'压轴',type:'solution',stem:'讨论 f(x)=x³−3ax 的单调性。',answer:'a≤0 时在 R 上递增；a>0 时在 (−∞,−√a) 和 (√a,+∞) 递增，在 (−√a,√a) 递减',steps:'f′=3x²−3a，按 a 的正负与根的位置分类讨论。',source:'改编'},
    {id:'q44',module:'函数与导数',node:'n10',methods:['m23'],diff:'压轴',type:'solution',stem:'讨论方程 e^x=ax（a>0）的实根个数。',answer:'0<a<e：0个；a=e：1个；a>e：2个',steps:'转化为 a=e^x/x（x>0），其最小值为 e（x=1 处），按 a 与 e 的大小讨论。',source:'改编'},
    {id:'q45',module:'函数与导数',node:'n11',methods:['m19'],diff:'压轴',type:'solution',stem:'若 f(x)=x²−2x+a 在 [0,3] 上有零点，求 a 的取值范围。',answer:'−3≤a≤1',steps:'f(x)=(x−1)²+a−1，在 [0,3] 上值域为 [a−1,a+3]；令 0 属于该区间，得 −3≤a≤1。',source:'改编'},
    {id:'q46',module:'函数与导数',node:'n12',methods:['m20'],diff:'压轴',type:'solution',stem:'证明当 x>0 时，e^x>1+x+x²/2。',answer:'略',steps:'令 h=e^x−1−x−x²/2，h′=e^x−1−x>0（x>0 时），h(0)=0，故 h>0。',source:'改编'},
    {id:'q47',module:'函数与导数',node:'n9',methods:['m16'],diff:'压轴',type:'solution',stem:'若 f(x)=x³−3x+m 有三个零点，求 m 的取值范围。',answer:'−2<m<2',steps:'极大值 2+m>0，极小值 −2+m<0，解得 −2<m<2。',source:'改编'},
    {id:'q48',module:'函数与导数',node:'n12',methods:['m20'],diff:'压轴',type:'solution',stem:'证明当 x>0 时，ln x≤x−1。',answer:'略',steps:'令 g(x)=ln x−x+1，g′=1/x−1，x=1 取极大值 g(1)=0，故 g≤0。',source:'改编'}
  ];

  return { nodes: nodes, methods: methods, questions: questions };
})();
