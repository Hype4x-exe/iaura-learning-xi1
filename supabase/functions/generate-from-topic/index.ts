import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic } = await req.json();
    
    if (!topic || !topic.trim()) {
      return new Response(
        JSON.stringify({ error: "Topic is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log(`Generating content for topic: ${topic}`);

    // Call Lovable AI to generate comprehensive study material
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are an expert educational content creator. Generate comprehensive, well-structured study materials that help students learn effectively. Return ONLY valid JSON without any markdown formatting or code blocks.'
          },
          {
            role: 'user',
            content: `Generate COMPREHENSIVE, EXAM-READY study materials for: "${topic}"

CRITICAL REQUIREMENTS:

1. EXTENSIVE NOTES (800-1200 words):
   - Write detailed, thorough explanations like a textbook chapter
   - Include definitions, concepts, theories, and their applications
   - Add historical context, key figures, and important dates when relevant
   - Explain WHY things work, not just WHAT they are
   - Include comparisons, contrasts, and relationships between concepts
   - Use clear headings and organized sections
   - This should be comprehensive enough for serious exam preparation

2. HIGH-QUALITY FLASHCARDS (12-15 cards):
   - Questions must be clear, specific, and unambiguous
   - Answers must be COMPLETE, detailed, and accurate (2-4 sentences each)
   - Include definitions, explanations, examples, and context in answers
   - Vary difficulty: 5 easy, 5 medium, 5 hard
   - Cover all major concepts from the notes
   - NO vague or incomplete answers
   
3. KEY POINTS (8-10 bullet points):
   - Each point should be a complete, detailed statement
   - Focus on exam-critical information
   - Include formulas, dates, names, and specific details

4. PRACTICAL EXAMPLES (4-6 examples):
   - Real-world applications and scenarios
   - Step-by-step worked examples when applicable
   - Diverse examples covering different aspects

5. QUIZ QUESTIONS (8-10 questions):
   - Mix: 4 multiple choice, 3 true/false, 3 short answer
   - Questions should test deep understanding
   - Explanations must be thorough and educational

Return ONLY valid JSON (no markdown):
{
  "title": "Topic Title",
  "summary": "EXTENSIVE 800-1200 word detailed notes with headings, explanations, context, and comprehensive coverage...",
  "flashcards": [
    {
      "question": "Clear, specific question",
      "answer": "COMPLETE detailed answer with explanation, context, and examples (2-4 sentences)",
      "difficulty": "easy|medium|hard"
    }
  ],
  "key_points": ["Detailed point 1...", "Detailed point 2..."],
  "examples": ["Real-world example 1...", "Example 2..."],
  "quiz_questions": [
    {
      "question": "Question testing deep understanding",
      "type": "multiple_choice|true_false|short_answer",
      "options": ["A", "B", "C", "D"],
      "correct_answer": "Correct answer",
      "explanation": "Thorough explanation of why this is correct and why others are wrong"
    }
  ]
}`
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits depleted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI API Error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content generated');
    }

    console.log('Raw AI response:', content);

    // Clean the response - remove markdown code blocks if present
    let cleanedContent = content.trim();
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    let parsedContent;
    try {
      parsedContent = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', cleanedContent);
      throw new Error('AI generated invalid JSON format');
    }

    console.log('Successfully generated content');

    return new Response(
      JSON.stringify(parsedContent),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('Error in generate-from-topic:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
