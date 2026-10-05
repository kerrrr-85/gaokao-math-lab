/* 三角函数模块内容（Task 2/3）：8 节点 + 16 方法卡 */
(function () {
  var M = '三角函数';
  window.DATA.nodes.push(
    {id:'t1',module:M,title:'任意角与弧度制',brief:'角的扩充、终边相同角、弧度换算',req:'理解任意角与弧度制，会进行角度与弧度互化，会求弧长与扇形面积。',prereq:[],methods:['tm1'],diff:'基础'},
    {id:'t2',module:M,title:'三角函数定义与符号',brief:'单位圆定义、象限符号、同角关系',req:'理解三角函数定义，掌握同角三角函数基本关系，会由终边一点求函数值。',prereq:['t1'],methods:['tm2','tm3'],diff:'基础'},
    {id:'t3',module:M,title:'诱导公式',brief:'任意角化为锐角、化简求值',req:'会用诱导公式把任意角三角函数化为锐角三角函数。',prereq:['t2'],methods:['tm4'],diff:'基础'},
    {id:'t4',module:M,title:'三角函数的图象与性质',brief:'五点法、周期、单调、对称、最值',req:'掌握正弦、余弦、正切函数的图象与性质，会求周期与单调区间。',prereq:['t2'],methods:['tm5','tm6'],diff:'中档'},
    {id:'t5',module:M,title:'和差角与二倍角公式',brief:'和差公式、二倍角、降幂',req:'掌握两角和差与二倍角公式，能进行化简与求值。',prereq:['t3'],methods:['tm7','tm8'],diff:'中档'},
    {id:'t6',module:M,title:'辅助角公式与三角函数最值',brief:'asinx+bcosx 合一、值域与最值',req:'会用辅助角公式化为一角一函数，求周期与最值。',prereq:['t4','t5'],methods:['tm9'],diff:'中档'},
    {id:'t7',module:M,title:'正弦定理与余弦定理',brief:'解三角形两大定理与面积公式',req:'掌握正弦定理、余弦定理和面积公式，能解三角形。',prereq:['t1'],methods:['tm10','tm11','tm12'],diff:'中档'},
    {id:'t8',module:M,title:'解三角形综合与最值',brief:'边角互化、解的个数、范围与实际问题',req:'能综合运用两个定理解决范围、最值与实际测量问题。',prereq:['t7'],methods:['tm13','tm14','tm15','tm16'],diff:'压轴'}
  );
  window.DATA.methods.push(
    {id:'tm1',module:M,node:'t1',title:'角度与弧度互化',trigger:'角度与弧度混用，或求弧长、扇形面积',steps:['记住 π rad = 180°，按比例换算','弧长 l = |α|·r','扇形面积 S = ½ l r = ½ |α| r²'],formula:'π rad = 180°',mistake:'换算方向搞反（乘除颠倒）',diff:'基础'},
    {id:'tm2',module:M,node:'t2',title:'由终边一点求三角函数值',trigger:'角 α 的终边经过点 P(x, y)',steps:['求 r = √(x²+y²)','sinα = y/r，cosα = x/r，tanα = y/x','按象限确定符号'],formula:'r = √(x²+y²)',mistake:'忘记按象限定符号',diff:'基础'},
    {id:'tm3',module:M,node:'t2',title:'同角关系与弦切互化',trigger:'已知 sinα 或 cosα，求其余',steps:['用 sin²α + cos²α = 1','由象限确定开方后的符号','用 tanα = sinα/cosα 互化'],formula:'sin²α + cos²α = 1',mistake:'开方时丢掉负号',diff:'基础'},
    {id:'tm4',module:M,node:'t3',title:'诱导公式化简',trigger:'出现 π±α、2kπ±α、π/2±α',steps:['统一化为 kπ/2 ± α 的形式','用“奇变偶不变，符号看象限”','约分并按特殊角求值'],formula:'奇变偶不变，符号看象限',mistake:'符号判断错（把 α 当锐角看象限）',diff:'基础'},
    {id:'tm5',module:M,node:'t4',title:'五点法作图与读图',trigger:'画图或由图象求解析式',steps:['取 ωx+φ = 0、π/2、π、3π/2、2π 五点','描点连线','由图象读振幅、周期与初相'],formula:'y = A sin(ωx+φ)',mistake:'相位平移方向判断错',diff:'中档'},
    {id:'tm6',module:M,node:'t4',title:'三角函数性质与最值',trigger:'求周期、单调区间、对称轴或最值',steps:['化为标准式','把 ωx+φ 整体代入正弦/余弦的性质','解不等式或取最值时回代'],formula:'T = 2π/|ω|',mistake:'忽略定义域导致单调区间写错',diff:'中档'},
    {id:'tm7',module:M,node:'t5',title:'和差角公式求值',trigger:'出现 α±β 或非特殊角',steps:['把待求角拆成已知角的和差','套用和差角公式','约分求值'],formula:'sin(α±β) = sinαcosβ ± cosαsinβ',mistake:'公式中的符号写错',diff:'中档'},
    {id:'tm8',module:M,node:'t5',title:'二倍角与降幂',trigger:'出现 2α 或平方项',steps:['用二倍角公式','对平方项降幂升次','合并化简'],formula:'cos2α = 2cos²α − 1 = 1 − 2sin²α',mistake:'三个等价形式选错导致变形卡住',diff:'中档'},
    {id:'tm9',module:M,node:'t6',title:'辅助角合一求最值',trigger:'形如 a sinx + b cosx',steps:['提取 √(a²+b²)','化为一角一函数','由正弦值域求最值与周期'],formula:'a sinx + b cosx = √(a²+b²) sin(x+φ)',mistake:'φ 的取值算错',diff:'中档'},
    {id:'tm10',module:M,node:'t7',title:'正弦定理解三角形',trigger:'已知两角一边，或两边及其中一边的对角',steps:['写出正弦定理','代入已知量求解','对“两边一对角”讨论解的个数'],formula:'a/sinA = b/sinB = c/sinC = 2R',mistake:'漏掉双解情形',diff:'中档'},
    {id:'tm11',module:M,node:'t7',title:'余弦定理解三角形',trigger:'已知两边夹一角，或已知三边',steps:['套用余弦定理','求第三边或某个角','判断三角形的形状'],formula:'a² = b² + c² − 2bc·cosA',mistake:'边与角没有对应',diff:'中档'},
    {id:'tm12',module:M,node:'t7',title:'三角形面积公式',trigger:'求三角形面积',steps:['选含已知角的面积式','代入已知边与夹角','必要时先用定理求边'],formula:'S = ½ bc·sinA',mistake:'用了不是夹角的两边',diff:'中档'},
    {id:'tm13',module:M,node:'t8',title:'边角互化',trigger:'条件中边与角混合出现',steps:['用正、余弦定理把条件统一成边或统一成角','化简得到关系式','求值或判断形状'],formula:'a = 2R sinA',mistake:'两边互化方向不统一',diff:'压轴'},
    {id:'tm14',module:M,node:'t8',title:'解的个数讨论',trigger:'已知两边及其中一边的对角',steps:['算出 b·sinA 作为临界值','把已知边与该临界值比较','按大小分情况写出解的个数'],formula:'临界值 b·sinA',mistake:'忘记分类讨论',diff:'压轴'},
    {id:'tm15',module:M,node:'t8',title:'三角形中的范围与最值',trigger:'求周长或面积的最大值、取值范围',steps:['用定理把目标表示成单变量函数','用基本不等式或三角函数求最值','验证取等条件是否满足三角形'],formula:'基本不等式 / 三角函数值域',mistake:'忽略三角形自身的约束条件',diff:'压轴'},
    {id:'tm16',module:M,node:'t8',title:'解三角形实际应用',trigger:'测量距离、高度、方位角问题',steps:['画图建模，标出已知边角','确定要解的是哪个三角形','选用正弦或余弦定理求解'],formula:'正、余弦定理',mistake:'方位角画错导致模型错误',diff:'压轴'}
  );
  window.DATA.questions.push(
    {id:'tq1',module:'三角函数',node:'t1',methods:['tm1'],diff:'基础',type:'fill',stem:'把 60° 化为弧度。',answer:'π/3',steps:'60×π/180=π/3。',source:'自编'},
    {id:'tq2',module:'三角函数',node:'t1',methods:['tm1'],diff:'基础',type:'fill',stem:'半径为 2、圆心角为 π/3 的弧长是多少？',answer:'2π/3',steps:'l=|α|r=π/3×2=2π/3。',source:'自编'},
    {id:'tq3',module:'三角函数',node:'t2',methods:['tm2'],diff:'基础',type:'choice',stem:'角 α 的终边过点 (3,4)，则 sinα=',options:['3/5','4/5','4/3','3/4'],answer:'B',steps:'r=5，sinα=4/5。',source:'自编'},
    {id:'tq4',module:'三角函数',node:'t2',methods:['tm3'],diff:'基础',type:'fill',stem:'已知 sinα=3/5，α 是第二象限角，求 cosα。',answer:'-4/5',steps:'cosα=-√(1-9/25)=-4/5。',source:'自编'},
    {id:'tq5',module:'三角函数',node:'t3',methods:['tm4'],diff:'基础',type:'fill',stem:'计算 sin150°。',answer:'1/2',steps:'sin150°=sin30°=1/2。',source:'自编'},
    {id:'tq6',module:'三角函数',node:'t4',methods:['tm6'],diff:'基础',type:'choice',stem:'函数 y=sinx 的最小正周期是：',options:['π/2','π','2π','4π'],answer:'C',steps:'T=2π。',source:'自编'},
    {id:'tq7',module:'三角函数',node:'t5',methods:['tm7'],diff:'基础',type:'fill',stem:'计算 sin30°cos60°+cos30°sin60°。',answer:'1',steps:'=sin(30°+60°)=sin90°=1。',source:'自编'},
    {id:'tq8',module:'三角函数',node:'t6',methods:['tm9'],diff:'基础',type:'fill',stem:'函数 y=sinx+cosx 的最大值是多少？',answer:'√2',steps:'=√2sin(x+45°)，最大值 √2。',source:'自编'},
    {id:'tq9',module:'三角函数',node:'t2',methods:['tm3'],diff:'中档',type:'solution',stem:'已知 tanα=2，α 是第三象限角，求 sinα。',answer:'-2√5/5',steps:'由 sinα/cosα=2 与 sin²α+cos²α=1 得 sin²α=4/5；第三象限 sinα<0，故 sinα=-2√5/5。',source:'改编'},
    {id:'tq10',module:'三角函数',node:'t3',methods:['tm4'],diff:'中档',type:'choice',stem:'cos(-π/3)=',options:['1/2','-1/2','√3/2','-√3/2'],answer:'A',steps:'cos 为偶函数，cos(-π/3)=cos(π/3)=1/2。',source:'自编'},
    {id:'tq11',module:'三角函数',node:'t4',methods:['tm6'],diff:'中档',type:'solution',stem:'求 y=2sin(2x+π/6) 的最小正周期与最大值。',answer:'T=π，最大值为 2',steps:'T=2π/2=π；振幅为 2，最大值为 2。',source:'自编'},
    {id:'tq12',module:'三角函数',node:'t4',methods:['tm6'],diff:'中档',type:'fill',stem:'写出 y=cosx 的单调递增区间（用 k 表示）。',answer:'[2kπ-π,2kπ]',steps:'余弦函数在 [2kπ-π,2kπ] 上单调递增。',source:'自编'},
    {id:'tq13',module:'三角函数',node:'t5',methods:['tm8'],diff:'中档',type:'solution',stem:'已知 sinα=3/5，α∈(0,π/2)，求 sin2α。',answer:'24/25',steps:'cosα=4/5，sin2α=2sinαcosα=2×3/5×4/5=24/25。',source:'自编'},
    {id:'tq14',module:'三角函数',node:'t5',methods:['tm8'],diff:'中档',type:'fill',stem:'计算 cos²15°-sin²15°。',answer:'√3/2',steps:'=cos30°=√3/2。',source:'自编'},
    {id:'tq15',module:'三角函数',node:'t6',methods:['tm9'],diff:'中档',type:'solution',stem:'求 y=√3sinx+cosx 的最大值与最小值。',answer:'最大 2，最小 -2',steps:'=2sin(x+30°)，最值为 ±2。',source:'自编'},
    {id:'tq16',module:'三角函数',node:'t6',methods:['tm9'],diff:'中档',type:'fill',stem:'写出 f(x)=sinx+cosx 的一条对称轴（x>0 的最小值）。',answer:'x=π/4',steps:'=√2sin(x+π/4)，对称轴满足 x+π/4=π/2，故 x=π/4。',source:'改编'},
    {id:'tq17',module:'三角函数',node:'t7',methods:['tm10'],diff:'中档',type:'choice',stem:'在△ABC中，a=2，b=2√3，A=30°，则 B=',options:['30°','60°','120°','60°或120°'],answer:'D',steps:'sinB=b·sinA/a=√3/2，B=60°或120°，两者都满足内角和。',source:'改编'},
    {id:'tq18',module:'三角函数',node:'t7',methods:['tm11'],diff:'中档',type:'solution',stem:'△ABC中 b=3，c=4，A=60°，求 a。',answer:'√13',steps:'a²=9+16-2×3×4×cos60°=25-12=13，a=√13。',source:'自编'},
    {id:'tq19',module:'三角函数',node:'t7',methods:['tm12'],diff:'中档',type:'fill',stem:'△ABC中 a=3，b=4，C=30°，求面积。',answer:'3',steps:'S=½ab·sinC=½×3×4×½=3。',source:'自编'},
    {id:'tq20',module:'三角函数',node:'t8',methods:['tm11'],diff:'中档',type:'solution',stem:'△ABC中 a=1，b=1，C=120°，求 c。',answer:'√3',steps:'c²=1+1-2×1×1×cos120°=2+1=3，c=√3。',source:'自编'},
    {id:'tq21',module:'三角函数',node:'t8',methods:['tm15'],diff:'中档',type:'solution',stem:'△ABC中 A=60°，a=2，求 b+c 的最大值。',answer:'4',steps:'b/sinB=c/sinC=2/sin60°=4/√3；b+c=(4/√3)(sinB+sinC)，B+C=120°，最大值为 4。',source:'改编'},
    {id:'tq22',module:'三角函数',node:'t3',methods:['tm4'],diff:'中档',type:'fill',stem:'用 sinα 表示 sin(π+α)。',answer:'-sinα',steps:'诱导公式 sin(π+α)=-sinα。',source:'自编'},
    {id:'tq23',module:'三角函数',node:'t4',methods:['tm6'],diff:'中档',type:'choice',stem:'y=sinx 在 [0,π] 上的最小值是：',options:['-1','0','1','-1/2'],answer:'B',steps:'在 [0,π] 上 sinx≥0，最小值为 0。',source:'自编'},
    {id:'tq24',module:'三角函数',node:'t7',methods:['tm11'],diff:'中档',type:'solution',stem:'△ABC中 a=2，b=2，C=60°，判断三角形形状。',answer:'等边三角形',steps:'c²=4+4-2×2×2×½=4，c=2，三边相等。',source:'自编'},
    {id:'tq25',module:'三角函数',node:'t8',methods:['tm13'],diff:'压轴',type:'solution',stem:'△ABC中 (2b-c)cosA=a·cosC，求 A。',answer:'A=60°',steps:'边化角：2sinBcosA-sinCcosA=sinAcosC，整理得 2sinBcosA=sin(A+C)=sinB，cosA=1/2，A=60°。',source:'改编'},
    {id:'tq26',module:'三角函数',node:'t8',methods:['tm15'],diff:'压轴',type:'solution',stem:'△ABC中 a=2，A=60°，求面积的最大值。',answer:'√3',steps:'a²=b²+c²-bc=4，bc≤4；S=½bc·sin60°≤√3。',source:'改编'},
    {id:'tq27',module:'三角函数',node:'t8',methods:['tm15'],diff:'压轴',type:'solution',stem:'△ABC中 b=2，B=60°，求 a+c 的取值范围。',answer:'(2,4]',steps:'a/sinA=c/sinC=2/sin60°=4/√3；a+c=(4/√3)(sinA+sinC)，A+C=120°，最大值为 4，下确界为 2。',source:'改编'},
    {id:'tq28',module:'三角函数',node:'t6',methods:['tm8','tm9'],diff:'压轴',type:'solution',stem:'求 y=sin²x+2sinxcosx+3cos²x 的最大值与最小值。',answer:'最大 2+√2，最小 2-√2',steps:'降幂化简：y=2+sin2x+cos2x=2+√2sin(2x+π/4)，最值为 2±√2。',source:'改编'},
    {id:'tq29',module:'三角函数',node:'t5',methods:['tm7'],diff:'压轴',type:'solution',stem:'已知 cos(α-β)=3/5，sinβ=-5/13，α∈(0,π/2)，β∈(-π/2,0)，求 sinα。',answer:'33/65',steps:'sin(α-β)=4/5，cosβ=12/13；sinα=sin[(α-β)+β]=4/5×12/13+3/5×(-5/13)=33/65。',source:'改编'},
    {id:'tq30',module:'三角函数',node:'t7',methods:['tm13'],diff:'压轴',type:'solution',stem:'△ABC中 a·cosB+b·cosA=2c·cosC，求 C。',answer:'C=60°',steps:'边化角得 sin(A+B)=2sinCcosC，即 sinC=2sinCcosC，cosC=1/2，C=60°。',source:'改编'},
    {id:'tq31',module:'三角函数',node:'t8',methods:['tm14'],diff:'压轴',type:'solution',stem:'△ABC中 a=2，b=√2，A=45°，求 B。',answer:'B=30°',steps:'sinB=b·sinA/a=√2×(√2/2)/2=1/2，B=30°或150°；因 A+B<180°，只能取 30°。',source:'改编'},
    {id:'tq32',module:'三角函数',node:'t7',methods:['tm11'],diff:'压轴',type:'solution',stem:'在△ABC中，若 a²+b²=c²，证明 C=90°。',answer:'略',steps:'由余弦定理 cosC=(a²+b²-c²)/(2ab)=0，且 C∈(0,π)，故 C=90°。',source:'自编'}
  );
})();
