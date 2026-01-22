import { BookOpen, Coffee, Heart, AlertCircle, Smile } from 'lucide-react';

export interface KnowledgeItem {
  id: string;
  title: string;
  query: string; // The text sent to the AI
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
    ]
  },
  {
    id: 'survival',
    title: '男友生存指南',
    description: '在她不舒服的时候，如何做一个满分男友？',
    color: 'bg-purple-100 text-purple-600',
    icon: Heart,
    items: [
      { id: 's1', title: '她痛经怎么办？', query: '女朋友现在痛经很难受，除了喝热水，我还能做哪些具体的事情来缓解她的疼痛？请给我3个立刻能做的建议。' },
      { id: 's2', title: '怎么哄经期发脾气的她？', query: '女朋友生理期情绪很差、易怒，我该怎么哄她？有哪些话是绝对不能说的？' },
      { id: 's3', title: '经期可以运动吗？', query: '女生来大姨妈的时候可以运动吗？适合做什么运动，不适合做什么？' },
    ]
  },
  {
    id: 'diet',
    title: '饮食与投喂',
    description: '在这个特殊时期，该给她吃什么，不该吃什么？',
    color: 'bg-green-100 text-green-600',
    icon: Coffee,
    items: [
      { id: 'd1', title: '经期绝对不能吃什么？', query: '女生经期有哪些食物是绝对不能吃的（比如生冷辛辣）？请列一个避雷清单。' },
      { id: 'd2', title: '缓解痛经的食物', query: '有哪些食物或饮品可以帮助缓解痛经？请推荐几个简单的食谱。' },
      { id: 'd3', title: '经期想吃甜食正常吗？', query: '为什么她经期特别想吃甜食？这时候给她买甜品好吗？有什么健康的替代品？' },
    ]
  },
  {
    id: 'taboos',
    title: '禁忌与误区避雷',
    description: '洗头、拔牙、献血？粉碎谣言，科学避雷。',
    color: 'bg-orange-100 text-orange-600',
    icon: AlertCircle,
    items: [
      { id: 't1', title: '经期绝对不能做的事', query: '除了不吃生冷，女生经期还有哪些绝对不能做的事情（例如拔牙、献血、剧烈运动等）？请科学地列举出来。' },
      { id: 't2', title: '经期可以洗头吗？', query: '老一辈说经期不能洗头、不能碰凉水，这些说法有科学依据吗？如果洗头需要注意什么？' },
      { id: 't3', title: '红糖水真的有用吗？', query: '大家都说痛经喝红糖水，这真的有用吗？还是只是安慰剂？有什么更科学的替代品？' },
    ]
  }
];

export const QUICK_TAGS = [
  "🤕 如何缓解痛经？",
  "🍲 今天适合吃什么？",
  "😡 怎么哄她开心？",
  "📅 排卵期有什么症状？",
  "❌ 经期绝对不能做什么？",
  "🍵 红糖水有用吗？"
];