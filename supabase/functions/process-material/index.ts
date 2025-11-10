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
    const { content, title } = await req.json();
    
    if (!content || !content.trim()) {
      return new Response(
        JSON.stringify({ error: "Content is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log(`Processing material: ${title || 'Untitled'}`);

    // Call Lovable AI to analyze and generate study materials
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
            content: 'You are an expert educational content analyzer. Generate comprehensive study materials from provided content. Return ONLY valid JSON without any markdown formatting or code blocks.'
          },
          {
            role: 'user',
            content: `Analyze this material and create COMPREHENSIVE, EXAM-READY study resources.

Material Content:
${content}

CRITICAL REQUIREMENTS:

1. EXTENSIVE SUMMARY (600-1000 words):
   - Create detailed, thorough notes covering ALL concepts in the material
   - Explain definitions, theories, processes, and applications in depth
   - Add context, examples, and connections between ideas
   - Organize with clear headings and logical flow
   - Make it comprehensive enough for serious exam preparation
   - Include ALL important details from the source material

2. HIGH-QUALITY FLASHCARDS (12-15 cards):
   - Extract the most important concepts from the material
   - Questions must be clear and specific
   - Answers must be COMPLETE and detailed (2-4 sentences each)
   - Include explanations, context, and examples in answers
   - Vary difficulty: 5 easy, 5 medium, 5 hard
   - NO vague or incomplete answers

3. KEY POINTS (8-10 bullet points):
   - Detailed statements covering critical information
   - Include specific details, formulas, dates, or names
   - Each point should be exam-worthy

4. PRACTICAL EXAMPLES (4-6 examples):
   - Real-world applications from the material
   - Step-by-step demonstrations when applicable
   - Diverse examples covering different aspects

5. QUIZ QUESTIONS (8-10 questions):
   - Mix: 4 multiple choice, 3 true/false, 3 short answer
   - Test deep understanding of the material
   - Thorough explanations for each answer

Return ONLY valid JSON (no markdown):
{
  "summary": "EXTENSIVE 600-1000 word summary with all concepts, explanations, and details...",
  "flashcards": [
    {
      "question": "Clear, specific question",
      "answer": "COMPLETE detailed answer with full explanation (2-4 sentences)",
      "difficulty": "easy|medium|hard"
    }
  ],
  "key_points": ["Detailed point 1...", "Detailed point 2..."],
  "examples": ["Example 1 with context...", "Example 2..."],
  "quiz_questions": [
    {
      "question": "Deep understanding question",
      "type": "multiple_choice|true_false|short_answer",
      "options": ["A", "B", "C", "D"],
      "correct_answer": "Correct answer",
      "explanation": "Thorough explanation"
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
    const aiContent = data.choices?.[0]?.message?.content;
    
    if (!aiContent) {
      throw new Error('No content generated');
    }

    console.log('Raw AI response:', aiContent);

    // Clean the response - remove markdown code blocks if present
    let cleanedContent = aiContent.trim();
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

    console.log('Successfully processed material');

    return new Response(
      JSON.stringify(parsedContent),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('Error in process-material:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
