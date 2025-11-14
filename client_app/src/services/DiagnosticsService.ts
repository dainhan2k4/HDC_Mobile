import { API_CONFIG, API_ENDPOINTS } from '../config/apiConfig';
import { apiService } from '../config/apiService';

type DiagnosticResult = {
  ok: boolean;
  notes: string[];
};

export async function runDiagnostics(): Promise<DiagnosticResult> {
  const notes: string[] = [];
  try {
    // Luôn dùng middleware (không còn USE_MIDDLEWARE flag)
    notes.push('Using middleware API exclusively');

    // 1) Test health endpoint
    try {
      const healthUrl = `http://${API_CONFIG.LOCAL_HOST}:3001/health`;
      const healthResponse = await fetch(healthUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        }
      });
      const healthData = await healthResponse.json();
      if (healthData.success) {
        notes.push('✅ Middleware health check OK');
      } else {
        notes.push('⚠️ Middleware health check returned false');
      }
    } catch (healthError: any) {
      notes.push(`❌ Middleware health check failed: ${healthError.message}`);
      return { ok: false, notes };
    }

    // 2) Test portfolio overview endpoint
    try {
      const overviewResponse = await apiService.getPortfolioOverview();
      if (overviewResponse.success && overviewResponse.data) {
        notes.push('✅ Middleware /portfolio/overview OK');
        
        // Check structure
        const overviewData = overviewResponse.data as any;
        const overviewKeys = [
          'totalInvestment',
          'totalCurrentValue',
          'totalProfitLoss',
          'totalProfitLossPercentage',
        ];
        const hasOverviewKeys = overviewKeys.some((k) => 
          overviewData.hasOwnProperty(k) || overviewData.hasOwnProperty(k.replace(/([A-Z])/g, '_$1').toLowerCase())
        );
        
        if (hasOverviewKeys) {
          notes.push('✅ Middleware overview structure OK');
        } else {
          notes.push('⚠️ Middleware overview structure may be different');
        }
      } else {
        notes.push('⚠️ Middleware /portfolio/overview returned no data');
      }
    } catch (overviewError: any) {
      notes.push(`❌ Middleware /portfolio/overview failed: ${overviewError.message}`);
    }

    // 3) Test investments endpoint
    try {
      const investmentsResponse = await apiService.getInvestments();
      if (investmentsResponse.success) {
        const investments = Array.isArray(investmentsResponse.data) ? investmentsResponse.data : [];
        notes.push(`✅ Middleware /portfolio/investments OK (${investments.length} items)`);
      } else {
        notes.push('⚠️ Middleware /portfolio/investments returned no data');
      }
    } catch (investmentsError: any) {
      notes.push(`❌ Middleware /portfolio/investments failed: ${investmentsError.message}`);
    }

    return { ok: true, notes };
  } catch (e: any) {
    notes.push(`❌ Diagnostics error: ${e?.message || String(e)}`);
    return { ok: false, notes };
  }
}


