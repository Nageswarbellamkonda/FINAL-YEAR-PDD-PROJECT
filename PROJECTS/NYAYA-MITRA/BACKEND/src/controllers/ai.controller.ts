import { Request, Response } from 'express';
import { supabase } from '../config/supabaseClient';

export const askNyayaAI = async (req: Request, res: Response): Promise<void> => {
    try {
        const { query, context } = req.body;
        // In a real implementation, this would call an LLM API.
        // For the migration, we simulate the AI response or fetch from a predefined AI cache/DB.
        const mockResponse = `This is a simulated AI response for: "${query}". Based on BNSS 2023 and BNS 2023, the appropriate action is...`;
        
        res.json({ answer: mockResponse, sources: ['BNS Sec 103', 'BNSS Sec 173'] });
    } catch (err: any) {
        res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
};

export const getPoliceAdvisory = async (req: Request, res: Response): Promise<void> => {
    try {
        const { station_id, current_stats } = req.body;
        
        const advisory = {
            strategy: "Increase patrols in Zone A during 18:00 - 22:00",
            riskLevel: "High",
            recommendedActions: [
                "Deploy 2 additional She Teams",
                "Set up checkpost at main junction"
            ]
        };
        
        res.json(advisory);
    } catch (err: any) {
        res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
};

export const analyzePatterns = async (req: Request, res: Response): Promise<void> => {
    try {
        const payload = req.body;
        
        // Dynamic simulated response using the provided payload
        const topCategoriesStr = payload.top_categories?.map((c: any) => `- **${c.name}**: ${c.value} cases`).join('\n') || "No data available";
        const topDistrictsStr = payload.top_districts?.map((d: any) => `- **${d.name}**: ${d.value} cases`).join('\n') || "No data available";
        
        const mockInsights = `
### 🧠 NyayaAI Crime Intelligence Report
**Analysis Period:** ${payload.period} | **Total Cases:** ${payload.total_cases} | **Resolution Rate:** ${payload.resolution_rate}%

#### 1. Key Crime Patterns & Trends
Our analysis over the last ${payload.period} indicates a significant concentration of incidents within specific classifications. The current resolution rate of ${payload.resolution_rate}% suggests a moderate backlog. There are currently **${payload.critical_open} critical cases** requiring immediate attention.

**Top Categories of Concern:**
${topCategoriesStr}

#### 2. Hotspot Districts / Areas of Concern
Geospatial mapping highlights the following regions as primary hotspots for recent criminal activity:
${topDistrictsStr}

#### 3. Likely Causes & Modus Operandi
- Increased digital transactions without adequate awareness have driven a surge in **Cyber Fraud**.
- Urban population density in districts like Visakhapatnam and Vijayawada correlates with higher rates of petty crimes and physical altercations.

#### 4. Operational Recommendations for AP Police
- **Cyber Cell Expansion:** Allocate 15% more personnel to the Cyber Crime divisions in the top 3 districts.
- **Targeted Patrols:** Implement high-visibility policing (Blue Colts) in identified hotspots during peak hours (18:00 - 23:00).
- **Public Awareness:** Launch a localized digital literacy campaign targeting vulnerable demographics identified in recent fraud cases.

#### 5. Predictive Forecast (Next 30 Days)
Based on current trajectories and seasonal patterns, we forecast a **5-8% increase in financial cybercrimes** and a potential stabilization in physical assaults. Continued vigilance in urban hotspots is highly recommended.
`;

        // Simulate API delay for realism
        setTimeout(() => {
            res.json({ insights: mockInsights });
        }, 1500);
        
    } catch (err: any) {
        console.error("Error in analyzePatterns:", err);
        res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
};
