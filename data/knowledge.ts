
import { BookOpen, Coffee, Heart, AlertCircle, Smile, ShieldAlert, Sparkles, Activity, Search, ThermometerSnowflake } from 'lucide-react';

export interface KnowledgeItem {
  id: string;
  title: string;
  query: string; // 发送给 AI 的 Prompt
  icon?: any;
}

export interface KnowledgeCategory {
  id: string;
  title: string;
  description: string;
  color: string;
  icon: any;
  items: KnowledgeItem[];
}

export const KNOWLEDGE_BASE: KnowledgeCategory[] = [
  {
    id: 'basics',
    title: '生理周期小课堂',
    description: '快速了解月经、排卵和黄体期的基础知识。',
    color: 'bg-pink-100 text-pink-600',
    icon: BookOpen,
    items: [
      { id: 'b1', title: '月经期要注意什么？', query: '科普一下女生月经期（生理期）的身体变化和注意事项，作为男朋友需要特别注意什么？' },
      { id: 'b2', title: '什么是排卵期？', query: '简单解释一下什么是排卵期？这个时候女生的身体和情绪会有什么变化？' },
      { id: 'b3', title: '什么是黄体期(PMS)？', query: '什么是黄体期或者PMS（经前综合症）？为什么这个时候她容易情绪不稳定？' },
      { id: 'b4', title: '月经周期怎么算？', query: '月经周期是如何计算的？正常的周期范围是多少天？' },
      { id: 'b5', title: '如何通过体温判断周期？', query: '基础体温（BBT）是如何随生理周期变化的？男友如何帮她监测排卵？' },
    ]
  },
  {
    id: 'survival',
    title: '男友生存指南',
    description: '在她不舒服的时候，如何做一个满分男友？',
    color: 'bg-rose-100 text-rose-600',
    icon: Heart,
    items: [
      { id: 's1', title: '她痛经怎么办？', query: '女朋友现在痛经很难受，除了喝热水，我还能做哪些具体的事情来缓解她的疼痛？请给我3个立刻能做的建议。' },
      { id: 's2', title: '怎么哄经期发脾气的她？', query: '女朋友生理期情绪很差、易怒，我该怎么哄她？有哪些话是绝对不能说的？' },
      { id: 's3', title: '经期可以运动吗？', query: '女生来大姨妈的时候可以运动吗？适合做什么运动，不适合做什么？' },
      { id: 's4', title: '如何帮她挑选卫生巾？', query: '超市里的卫生巾种类繁多（日用、夜用、护垫、安睡裤、棉条、液体卫生巾），男友如何帮她选购最合适的？' },
      { id: 's5', title: '经期可以洗澡/洗头吗？', query: '生理期洗头洗澡的科学建议是什么？有哪些细节需要注意？' },
    ]
  },
  {
    id: 'recovery',
    title: '经后“黄金周”',
    description: '经期结束后的 7 天是变美的黄金期，该如何规划？',
    color: 'bg-emerald-100 text-emerald-600',
    icon: Sparkles,
    items: [
      { id: 'r1', title: '什么是经后黄金期？', query: '经期结束后的第一个礼拜为什么叫“黄金期”？身体代谢和激素有什么特别？' },
      { id: 'r2', title: '经后补血吃什么？', query: '月经结束后，女生失血较多，男友应该买些什么补血、补铁的食物或补品给她？' },
      { id: 'r3', title: '黄金期运动减脂建议', query: '经后一周是减脂效率最高的时候吗？推荐一套适合女生的训练方案。' },
      { id: 'r4', title: '经后护肤要点', query: '黄金周皮肤状态最好，这个时候应该侧重哪些护肤步骤（如补水、深度清洁）？' },
    ]
  },
  {
    id: 'diet',
    title: '饮食与投喂',
    description: '在这个特殊时期，该给她吃什么，不该吃什么？',
    color: 'bg-amber-100 text-amber-600',
    icon: Coffee,
    items: [
      { id: 'd1', title: '经期避雷清单', query: '女生经期有哪些食物是绝对不能吃的（比如生冷辛辣）？请列一个避雷清单，包含具体的食物种类。' },
      { id: 'd2', title: '缓解痛经的食疗方', query: '除了红糖水，还有哪些热饮或甜汤能缓解痛经？请给几个简单易做的方子。' },
      { id: 'd3', title: '她特别想吃甜食正常吗？', query: '为什么她经期特别想吃甜食？这时候给她买甜品好吗？有什么健康的替代品？' },
      { id: 'd4', title: '关于咖啡和茶的建议', query: '女生在生理期可以喝冰咖啡、奶茶或浓茶吗？咖啡因对子宫收缩有影响吗？' },
    ]
  },
  {
    id: 'emergency',
    title: '应急与异常情况',
    description: '如果发现异常，该什么时候带她去看医生？',
    color: 'bg-red-100 text-red-600',
    icon: AlertCircle,
    items: [
      { id: 'e1', title: '月经突然推迟的原因', query: '除了怀孕，还有哪些因素（压力、环境、药物）会导致月经突然推迟或提前？' },
      { id: 'e2', title: '经量过多或过少怎么办？', query: '怎么判断月经量是否正常？如果出现血块或者经量暴增，男友应该怎么处理？' },
      { id: 'e3', title: '严重的痛经需要就医吗？', query: '继发性痛经是什么？如果吃止痛药都没用，可能是哪些妇科问题的征兆？' },
      { id: 'e4', title: '漏记了记录怎么办？', query: '如果忘了记录上次的时间，如何根据身体表现（如白带变化、胸胀）反推预测？' },
    ]
  },
  {
    id: 'myths',
    title: '科学辟谣与真相',
    description: '打破老一辈的禁忌，给温情带去科学。',
    color: 'bg-blue-100 text-blue-600',
    icon: ShieldAlert,
    items: [
      { id: 'm1', title: '红糖水真的是神药吗？', query: '科普：红糖水真的能缓解痛经吗？它的主要作用是什么？有没有更好的替代方案？' },
      { id: 'm2', title: '经期拔牙、献血的真相', query: '为什么医生建议女生避开经期做手术、拔牙或献血？凝血功能在此时会有变化吗？' },
      { id: 'm3', title: '月经会传染吗？', query: '所谓的“经期同步”（住在一起的女生周期变一致）是有科学依据的吗？' },
      { id: 'm4', title: '经期不能吃冰淇淋？', query: '吃冰真的会导致经血凝固吗？如果她实在想吃，男友该怎么权衡？' },
    ]
  }
];

export const QUICK_TAGS = [
  "🤒 缓解痛经",
  "🍲 经后补血",
  "😡 哄她开心",
  "❌ 避雷清单",
  "🍵 红糖水真相",
  "🧘 经期拉伸"
];
