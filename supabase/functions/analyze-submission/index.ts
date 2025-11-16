import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { github_link, demo_link, description, pitch_file_url, team_name, project_title } = await req.json();
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    console.log('Starting analysis for:', { project_title, team_name, github_link });

    // Fetch pitch file content if provided
    let pitchContent = null;
    if (pitch_file_url) {
      try {
        console.log('Fetching pitch file from:', pitch_file_url);
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        
        if (!supabaseUrl || !supabaseServiceKey) {
          throw new Error('Supabase credentials not configured');
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        // Extract file path from URL
        const urlParts = pitch_file_url.split('/pitch-files/');
        if (urlParts.length === 2) {
          const filePath = urlParts[1];
          const { data, error } = await supabase.storage.from('pitch-files').download(filePath);
          
          if (error) {
            console.error('Error downloading pitch file:', error);
          } else if (data) {
            // Convert blob to base64 for AI analysis
            const arrayBuffer = await data.arrayBuffer();
            const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
            pitchContent = {
              data: base64,
              mimeType: data.type,
              size: data.size
            };
            console.log('Pitch file downloaded successfully, size:', data.size);
          }
        }
      } catch (error) {
        console.error('Error processing pitch file:', error);
      }
    }

    // Fetch comprehensive GitHub data
    let githubData = null;
    if (github_link) {
      try {
        const repoMatch = github_link.match(/github\.com\/([^\/]+)\/([^\/]+)/);
        if (repoMatch) {
          const [, owner, repo] = repoMatch;
          const cleanRepo = repo.replace(/\.git$/, '');
          
          console.log('Fetching GitHub data for:', owner, cleanRepo);
          
          // Fetch README
          const readmeResponse = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}/readme`, {
            headers: { 'Accept': 'application/vnd.github.v3.raw' }
          });
          const readme = readmeResponse.ok ? await readmeResponse.text() : null;
          
          // Fetch all commits (up to 100)
          const commitsResponse = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}/commits?per_page=100`);
          const commits = commitsResponse.ok ? await commitsResponse.json() : [];
          
          // Fetch repo info
          const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}`);
          const repoInfo = repoResponse.ok ? await repoResponse.json() : null;
          
          // Fetch contributors
          const contributorsResponse = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}/contributors`);
          const contributors = contributorsResponse.ok ? await contributorsResponse.json() : [];
          
          // Fetch languages used
          const languagesResponse = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}/languages`);
          const languages = languagesResponse.ok ? await languagesResponse.json() : {};
          
          // Fetch pull requests
          const prsResponse = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}/pulls?state=all&per_page=50`);
          const pullRequests = prsResponse.ok ? await prsResponse.json() : [];
          
          // Calculate commit activity metrics
          const commitDates = commits.map((c: any) => new Date(c.commit.author.date));
          const firstCommit = commitDates.length > 0 ? new Date(Math.min(...commitDates.map((d: Date) => d.getTime()))) : null;
          const lastCommit = commitDates.length > 0 ? new Date(Math.max(...commitDates.map((d: Date) => d.getTime()))) : null;
          
          githubData = {
            readme: readme?.substring(0, 8000),
            totalCommits: commits.length,
            commits: commits.slice(0, 30).map((c: any) => ({
              message: c.commit.message,
              date: c.commit.author.date,
              author: c.commit.author.name,
              additions: c.stats?.additions || 0,
              deletions: c.stats?.deletions || 0
            })),
            stars: repoInfo?.stargazers_count || 0,
            forks: repoInfo?.forks_count || 0,
            watchers: repoInfo?.watchers_count || 0,
            openIssues: repoInfo?.open_issues_count || 0,
            language: repoInfo?.language || 'Unknown',
            languages: languages,
            description: repoInfo?.description || '',
            createdAt: repoInfo?.created_at,
            updatedAt: repoInfo?.updated_at,
            firstCommit: firstCommit?.toISOString(),
            lastCommit: lastCommit?.toISOString(),
            contributors: contributors.slice(0, 10).map((c: any) => ({
              login: c.login,
              contributions: c.contributions
            })),
            pullRequests: {
              total: pullRequests.length,
              merged: pullRequests.filter((pr: any) => pr.merged_at).length,
              open: pullRequests.filter((pr: any) => pr.state === 'open').length
            }
          };
          
          console.log('GitHub data fetched successfully:', {
            commits: githubData.totalCommits,
            contributors: githubData.contributors.length,
            prs: githubData.pullRequests.total
          });
        }
      } catch (error) {
        console.error('Error fetching GitHub data:', error);
      }
    }

    // Analyze with Gemini using direct API
    console.log('Starting AI analysis...');
    
    const analysisPrompt = `You are an expert hackathon judge with deep technical expertise. Analyze this project submission thoroughly and provide detailed, accurate insights.

PROJECT INFORMATION:
- Team Name: ${team_name}
- Project Title: ${project_title}
- Description: ${description}

${pitchContent ? `
PITCH DECK ANALYSIS:
A ${pitchContent.mimeType} pitch deck has been submitted (${(pitchContent.size / 1024).toFixed(2)} KB).
Please analyze the pitch deck structure, content quality, presentation style, and business viability.
The pitch deck is provided as base64 data for your analysis.
` : 'No pitch deck provided.'}

${githubData ? `
GITHUB REPOSITORY DEEP ANALYSIS:
Repository: ${github_link}
- Main Language: ${githubData.language}
- All Languages Used: ${JSON.stringify(githubData.languages)}
- Stars: ${githubData.stars} | Forks: ${githubData.forks} | Watchers: ${githubData.watchers}
- Open Issues: ${githubData.openIssues}
- Created: ${githubData.createdAt}
- Last Updated: ${githubData.updatedAt}
- First Commit: ${githubData.firstCommit}
- Last Commit: ${githubData.lastCommit}
- Repository Description: ${githubData.description}

COMMIT ACTIVITY (Total: ${githubData.totalCommits} commits):
${JSON.stringify(githubData.commits.slice(0, 20), null, 2)}

CONTRIBUTORS (${githubData.contributors.length} total):
${JSON.stringify(githubData.contributors, null, 2)}

PULL REQUESTS:
- Total: ${githubData.pullRequests.total}
- Merged: ${githubData.pullRequests.merged}
- Open: ${githubData.pullRequests.open}

README CONTENT:
${githubData.readme || 'No README available'}

ANALYSIS FOCUS:
- Assess commit frequency, quality, and consistency
- Evaluate code structure and architecture from commit messages
- Analyze team collaboration through contributor activity
- Review development practices (PRs, code reviews)
- Assess project documentation quality
` : 'No GitHub repository provided.'}

${demo_link ? `
DEMO LINK: ${demo_link}
Please consider the availability and quality of the live demo in your assessment.
` : 'No demo link provided.'}

SCORING CRITERIA (Be precise and justify each score):

1. **Technical Assessment** (Detailed analysis):
   - Code quality and architecture
   - Technology stack appropriateness
   - Implementation complexity
   - Best practices adherence
   - Scalability and performance considerations

2. **Innovation Score** (1-10):
   - Originality of the idea
   - Creative use of technology
   - Novel problem-solving approach
   - Market differentiation

3. **Completeness Score** (1-10):
   - Feature completeness
   - Documentation quality
   - Testing coverage
   - Production readiness
   - Polish and user experience

4. **GitHub Activity Score** (1-10):
   - Commit frequency and quality
   - Team collaboration effectiveness
   - Code review practices
   - Development velocity
   - Documentation maintenance

5. **Pitch Quality Score** (1-10, if pitch provided):
   - Presentation clarity
   - Business model viability
   - Market understanding
   - Value proposition strength
   - Visual design quality

6. **Potential Impact**:
   - Real-world applicability
   - Target audience size
   - Problem significance
   - Scalability potential

7. **Strengths** (List 3-5 specific strengths)

8. **Areas for Improvement** (List 3-5 specific, actionable suggestions)

9. **Overall Recommendation** (Detailed summary with final thoughts)

10. **Final Overall Score** (1-100):
    Calculate weighted average: 
    - Technical (25%)
    - Innovation (20%)
    - Completeness (20%)
    - GitHub Activity (15%)
    - Pitch Quality (10%, if available)
    - Impact (10%)

IMPORTANT: 
- Be thorough and specific in your analysis
- Provide concrete examples from the code/commits
- Give actionable feedback
- Be fair but critical
- Justify all scores with evidence

Format your response as a valid JSON object with these exact keys:
{
  "technical_assessment": "string",
  "innovation_score": number (1-10),
  "completeness_score": number (1-10),
  "github_activity_score": number (1-10),
  "pitch_quality_score": number (1-10 or null),
  "potential_impact": "string",
  "strengths": ["string array"],
  "areas_for_improvement": ["string array"],
  "overall_recommendation": "string",
  "final_score": number (1-100)
}`;

    const requestBody: any = {
      contents: [
        {
          parts: [
            { text: analysisPrompt }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.4,
        topK: 32,
        topP: 0.95,
        maxOutputTokens: 8192,
      }
    };

    // Add pitch file if available
    if (pitchContent) {
      requestBody.contents[0].parts.unshift({
        inline_data: {
          mime_type: pitchContent.mimeType,
          data: pitchContent.data
        }
      });
    }

    const aiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Gemini API error:', aiResponse.status, errorText);
      throw new Error(`Failed to analyze submission: ${aiResponse.status} ${errorText}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI response received');
    
    // Extract text from Gemini response
    const analysisText = aiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    if (!analysisText) {
      throw new Error('No analysis text returned from Gemini');
    }
    
    // Try to parse as JSON, extract from markdown code blocks if needed
    let analysis;
    try {
      // Try direct parse first
      analysis = JSON.parse(analysisText);
    } catch {
      try {
        // Try to extract JSON from markdown code block
        const jsonMatch = analysisText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[1]);
        } else {
          // Try to find JSON object in text
          const objectMatch = analysisText.match(/\{[\s\S]*\}/);
          if (objectMatch) {
            analysis = JSON.parse(objectMatch[0]);
          } else {
            throw new Error('No JSON found in response');
          }
        }
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        // Fallback structure with partial data
        analysis = {
          technical_assessment: analysisText,
          innovation_score: 7,
          completeness_score: 7,
          github_activity_score: githubData ? 7 : 0,
          pitch_quality_score: pitchContent ? 7 : null,
          potential_impact: 'Analysis completed - see technical assessment for details',
          strengths: ['Detailed analysis available in technical assessment'],
          areas_for_improvement: ['See technical assessment for specific recommendations'],
          overall_recommendation: 'Review technical assessment for comprehensive evaluation',
          final_score: 70
        };
      }
    }
    
    console.log('Analysis completed successfully');

    return new Response(
      JSON.stringify({ 
        analysis,
        github_data: githubData 
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in analyze-submission:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
