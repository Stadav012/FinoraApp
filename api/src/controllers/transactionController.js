const { supabaseClient } = require('../config/supabase');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const processTransaction = async (req, res) => {
  try {
    const { text, accountId } = req.body;
    const userId = req.user.id; 

    if (!text || !accountId) {
      return res.status(400).json({ error: 'Missing text or accountId' });
    }

    // prompting the LLM
    const prompt = `
      You are a financial data extraction AI for a global fintech app.
      Analyze this user transaction text and return ONLY a valid JSON object. 
      Do not include markdown formatting like \`\`\`json.
      
      Rules:
      - "amount": Extract the numerical value. Ignore all currency symbols. Return a raw positive number.
      - "type": Must be exactly "income" or "expense".
      - "description": A short, clean summary.
      - "category": A standard budget category name.
      - "color": A visually pleasing hex color code that conceptually matches the category.

      User Text: "${text}"
    `;

    // calling the LLM for extraction
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    let responseText = result.response.text();
    
    // cleaning the response to ensure it's pure JSON
    responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const aiData = JSON.parse(responseText);

    let categoryId = null; 

    if (aiData.category) {
      // searching for an existing category for the specific user
      const { data: existingCat } = await supabaseClient
        .from('categories')
        .select('id')
        .eq('user_id', userId)      
        .eq('type', aiData.type)     
        .ilike('name', `%${aiData.category}%`)
        .limit(1)
        .single();

      if (existingCat) {
        categoryId = existingCat.id;
      } else {
        // creating a brand new category if none found
        const { data: newCat, error: catError } = await supabaseClient
          .from('categories')
          .insert({
            user_id: userId,
            name: aiData.category,
            type: aiData.type,
            color: aiData.color || '#7a929c' // Fallback color if AI forgets
          })
          .select('id')
          .single();
          
        if (catError) console.error("Category Creation Error:", catError);
        if (newCat) categoryId = newCat.id;
      }
    }

    // saving the Transaction to the Database
    const { data, error } = await supabaseClient
      .from('transactions')
      .insert({
        user_id: userId,
        account_id: accountId,
        category_id: categoryId,
        description: aiData.description,
        amount: aiData.amount,
        type: aiData.type,
        transaction_date: new Date().toISOString(),
        parsed_from: text, 
      })
      .select()
      .single();

    if (error) throw error;

    res.status(200).json(data);

  } catch (err) {
    console.error('AI Processing Error:', err);
    res.status(500).json({ error: 'Failed to process transaction using AI' });
  }
};

module.exports = { processTransaction };