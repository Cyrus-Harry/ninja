
// api.js - ماژول ارتباط با JSONBin

const API_CONFIG = {
    // در اینجا باید API Key خود را وارد کنید
    API_KEY: '$2a$10$/5vpvMhVYT3akahPv1wWUOWQmg1ZunHHB2MAf.4QIPDRRrcpKwFRy',
    BIN_ID: '6a48dbe7da38895dfe2c9566', // بعد از ایجاد Bin این را وارد کنید
    BASE_URL: 'https://api.jsonbin.io/v3'
};

class ScoreAPI {
    constructor() {
        this.headers = {
            'Content-Type': 'application/json',
            'X-Master-Key': API_CONFIG.API_KEY
        };
        this.baseUrl = API_CONFIG.BASE_URL;
        this.binId = API_CONFIG.BIN_ID;
    }

    // دریافت تمام امتیازها
    async getScores(limit = 20) {
        try {
            const response = await fetch(`${this.baseUrl}/b/${this.binId}/latest`, {
                method: 'GET',
                headers: this.headers
            });
            
            if (!response.ok) throw new Error('خطا در دریافت امتیازات');
            
            const data = await response.json();
            let scores = data.record?.scores || [];
            
            // مرتب‌سازی بر اساس امتیاز (نزولی)
            scores.sort((a, b) => b.score - a.score);
            
            // محدود کردن تعداد
            return scores.slice(0, limit);
        } catch (error) {
            console.error('Error fetching scores:', error);
            return [];
        }
    }

    // ثبت امتیاز جدید
    async saveScore(playerName, score, distance = 0, crowsKilled = 0) {
        try {
            // ابتدا امتیازات فعلی را دریافت می‌کنیم
            const currentScores = await this.getScores(100);
            
            // امتیاز جدید را اضافه می‌کنیم
            const newScore = {
                id: Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
                playerName: playerName || 'نینجا',
                score: score,
                distance: distance,
                crowsKilled: crowsKilled,
                date: new Date().toISOString()
            };
            
            currentScores.push(newScore);
            
            // مرتب‌سازی و نگهداری فقط 50 امتیاز برتر
            currentScores.sort((a, b) => b.score - a.score);
            const topScores = currentScores.slice(0, 50);
            
            // آپدیت کردن در JSONBin
            const response = await fetch(`${this.baseUrl}/b/${this.binId}`, {
                method: 'PUT',
                headers: this.headers,
                body: JSON.stringify({ scores: topScores })
            });
            
            if (!response.ok) throw new Error('خطا در ثبت امتیاز');
            
            return await response.json();
        } catch (error) {
            console.error('Error saving score:', error);
            return null;
        }
    }

    // ایجاد Bin جدید (فقط یک بار استفاده می‌شود)
    async createBin() {
        try {
            const response = await fetch(`${this.baseUrl}/b`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({
                    scores: [
                        {
                            id: 'demo1',
                            playerName: 'نینجا سامورایی',
                            score: 2500,
                            distance: 450,
                            crowsKilled: 15,
                            date: new Date().toISOString()
                        },
                        {
                            id: 'demo2',
                            playerName: 'شینوبی',
                            score: 1800,
                            distance: 320,
                            crowsKilled: 10,
                            date: new Date().toISOString()
                        }
                    ]
                })
            });
            
            if (!response.ok) throw new Error('خطا در ایجاد Bin');
            
            const data = await response.json();
            console.log('Bin created! ID:', data.metadata?.id);
            return data;
        } catch (error) {
            console.error('Error creating bin:', error);
            return null;
        }
    }

    // حذف امتیاز (برای مدیریت)
    async deleteScore(scoreId) {
        try {
            const currentScores = await this.getScores(100);
            const updatedScores = currentScores.filter(s => s.id !== scoreId);
            
            const response = await fetch(`${this.baseUrl}/b/${this.binId}`, {
                method: 'PUT',
                headers: this.headers,
                body: JSON.stringify({ scores: updatedScores })
            });
            
            return response.ok;
        } catch (error) {
            console.error('Error deleting score:', error);
            return false;
        }
    }
}

// ایجاد نمونه از کلاس
const scoreAPI = new ScoreAPI();

// تابع کمکی برای نمایش امتیازات در جدول
function createLeaderboard(scores, containerId = 'leaderboardContainer') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (!scores || scores.length === 0) {
        container.innerHTML = '<p style="color:#fff;text-align:center;padding:20px;">هیچ امتیازی ثبت نشده است</p>';
        return;
    }
    
    let html = `
        <div style="
            max-height: 300px;
            overflow-y: auto;
            background: rgba(0,0,0,0.3);
            border-radius: 12px;
            padding: 10px;
            margin: 10px 0;
            border: 1px solid #0f3460;
        ">
            <table style="width:100%;color:#fff;border-collapse:collapse;font-size:14px;">
                <thead>
                    <tr style="border-bottom:2px solid #e94560;">
                        <th style="padding:8px;text-align:center;">#</th>
                        <th style="padding:8px;text-align:center;">بازیکن</th>
                        <th style="padding:8px;text-align:center;">امتیاز</th>
                        <th style="padding:8px;text-align:center;">فاصله</th>
                        <th style="padding:8px;text-align:center;">کلاغ</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    scores.forEach((score, index) => {
        const isTop3 = index < 3;
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
        const bgColor = isTop3 ? 'rgba(233,69,96,0.15)' : 'transparent';
        
        html += `
            <tr style="border-bottom:1px solid rgba(255,255,255,0.05);background:${bgColor};">
                <td style="padding:6px;text-align:center;">${medal || (index + 1)}</td>
                <td style="padding:6px;text-align:center;">${score.playerName || 'نینجا'}</td>
                <td style="padding:6px;text-align:center;color:#e94560;font-weight:bold;">${score.score}</td>
                <td style="padding:6px;text-align:center;">${score.distance || 0}m</td>
                <td style="padding:6px;text-align:center;">${score.crowsKilled || 0}</td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    container.innerHTML = html;
}

// صادر کردن ماژول
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { scoreAPI, createLeaderboard };
}