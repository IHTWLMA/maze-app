// AI处理管线 - 使用DeepSeek API
const API_BASE = 'https://api.deepseek.com/v1';
let API_KEY = ''; // 用户在"我的"页面配置

export function setApiKey(key) { API_KEY = key; }
export function getApiKey() { return API_KEY; }

async function callAI(prompt, systemPrompt = '你是一个知识管理助手。') {
  if (!API_KEY) throw new Error('请先在"我的"页面配置API Key');
  const res = await fetch(`${API_BASE}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
    }),
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

// AI简化:压缩成要点
export async function simplify(content) {
  return await callAI(
    `请将以下内容精简为核心要点(3-5条),保留关键信息,去掉冗余:\n\n${content}`,
    '你是知识摘要专家。输出简洁的要点列表,每条以"•"开头。'
  );
}

// AI注解:对专业术语加注释
export async function annotate(content) {
  return await callAI(
    `请对以下内容中的专业术语/概念添加注释(用括号标注),并补充背景知识:\n\n${content}`,
    '你是知识注解专家。在专业术语后用"()"加简短注释,让非专业人士也能理解。'
  );
}

// AI思考:生成延伸问题和实践建议
export async function think(content) {
  return await callAI(
    `基于以下内容,请生成:\n1. 2-3个延伸思考问题\n2. 1-2条实践建议\n3. 可能的关联知识领域\n\n内容:\n${content}`,
    '你是深度思考助手。输出结构化的思考内容。'
  );
}

// AI冲突检测:比较两段内容找出矛盾
export async function detectConflict(contentA, titleA, contentB, titleB) {
  return await callAI(
    `请比较以下两段知识内容,判断是否存在矛盾或冲突:\n\n【内容A】${titleA}:\n${contentA}\n\n【内容B】${titleB}:\n${contentB}\n\n如果存在冲突,请说明冲突点;如果无冲突,回复"无冲突"。`,
    '你是知识一致性审核专家。客观分析两段内容是否矛盾。'
  );
}

// AI自动分类:根据内容推荐标签和分组
export async function classify(title, content) {
  const result = await callAI(
    `根据以下内容,推荐:\n1. 3个标签(用逗号分隔)\n2. 1个知识分组名称\n\n标题:${title}\n内容:${content}`,
    '你是知识分类专家。只输出格式:tags:标签1,标签2,标签3\ngroup:分组名'
  );
  const tagsMatch = result.match(/tags:\s*(.+)/);
  const groupMatch = result.match(/group:\s*(.+)/);
  return {
    tags: tagsMatch ? tagsMatch[1].split(/[,，]/).map(s => s.trim()) : [],
    group: groupMatch ? groupMatch[1].trim() : '未分类',
  };
}
