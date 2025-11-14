import * as React from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { VictoryPie } from 'victory-native';
import { apiService } from '../../config/apiService';
import { middlewareApiService } from '../../services/MiddlewareApiService';
import { API_CONFIG, API_ENDPOINTS } from '../../config/apiConfig';
import { formatCurrency, formatPercent } from '../../utils/format';

type PortfolioOverview = {
  total_investment?: number;
  total_current_value?: number;
  total_profit_loss?: number;
  total_profit_loss_percentage?: number;
  funds?: Array<{
    id?: number;
    name?: string;
    ticker?: string;
    current_nav?: number;
    amount?: number;
    current_value?: number;
  }>;
};

export default function DashboardScreen() {
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [overview, setOverview] = React.useState(null as PortfolioOverview | null);
  const [recent, setRecent] = React.useState([] as any[]);
  const [pending, setPending] = React.useState([] as any[]);
  const [periodic, setPeriodic] = React.useState([] as any[]);
  const [error, setError] = React.useState(null as string | null);

  const load = async () => {
    try {
      setError(null);
      setLoading(true);

      if (API_CONFIG.USE_MIDDLEWARE) {
        // Dùng middleware: lấy dữ liệu theo format legacy đã transform
        const [{ portfolio }, transactions, pendingRes, periodicRes] = await Promise.all([
          middlewareApiService.getLegacyPortfolioData(),
          apiService.get(API_ENDPOINTS.TRANSACTIONS.CONTROLLER.ORDER).catch(() => ({ data: [] } as any)),
          apiService.get(API_ENDPOINTS.TRANSACTIONS.CONTROLLER.PENDING).catch(() => ({ data: [] } as any)),
          apiService.get(API_ENDPOINTS.TRANSACTIONS.CONTROLLER.PERIODIC).catch(() => ({ data: [] } as any)),
        ]);

        setOverview({
          total_investment: portfolio.total_investment || 0,
          total_current_value: portfolio.total_current_value || 0,
          total_profit_loss: portfolio.total_profit_loss || 0,
          total_profit_loss_percentage: portfolio.total_profit_loss_percentage || 0,
          funds: portfolio.funds?.map((f: any) => ({
            id: f.id,
            name: f.name,
            ticker: f.ticker,
            current_nav: f.current_nav,
            amount: f.total_amount ?? f.amount,
            current_value: f.current_value ?? 0,
          })) || [],
        });
        setRecent(Array.isArray((transactions as any)?.data) ? (transactions as any).data : []);
        setPending(Array.isArray((pendingRes as any)?.data) ? (pendingRes as any).data : []);
        setPeriodic(Array.isArray((periodicRes as any)?.data) ? (periodicRes as any).data : []);
      } else {
        // Gọi trực tiếp Odoo controller (fund_management)
        const [ovRes, invRes, txRes, pendingRes, periodicRes] = await Promise.all([
          apiService.get(API_ENDPOINTS.PORTFOLIO.DASHBOARD).catch(() => ({ data: null } as any)),
          apiService.get(API_ENDPOINTS.INVESTMENTS.LIST).catch(() => ({ data: [] } as any)),
          apiService.get(API_ENDPOINTS.TRANSACTIONS.ORDER).catch(() => ({ data: [] } as any)),
          apiService.get(API_ENDPOINTS.TRANSACTIONS.PENDING).catch(() => ({ data: [] } as any)),
          apiService.get(API_ENDPOINTS.TRANSACTIONS.PERIODIC).catch(() => ({ data: [] } as any)),
        ]);
  
        const ovData = (ovRes as any)?.data || null;
        const invData = (invRes as any)?.data || [];
        const txData = (txRes as any)?.data || [];
  
        // Chuẩn hoá overview để phù hợp UI
        const normalized: PortfolioOverview | null = ovData
          ? {
              total_investment:
                ovData.total_investment ??
                ovData.totalInvestment ??
                0,
              total_current_value:
                ovData.total_current_value ??
                ovData.totalCurrentValue ??
                0,
              total_profit_loss:
                ovData.total_profit_loss ??
                ovData.totalProfitLoss ??
                0,
              total_profit_loss_percentage:
                ovData.total_profit_loss_percentage ??
                ovData.totalProfitLossPercentage ??
                0,
              funds:
                ovData.funds ??
                (Array.isArray(invData)
                  ? invData.map((it: any) => ({
                      id: it.fund_id,
                      name: it.fund_name,
                      ticker: it.fund_ticker,
                      current_nav: it.current_nav,
                      amount: it.amount,
                      current_value: (Number(it.units) || 0) * (Number(it.current_nav) || 0),
                    }))
                  : []),
            }
          : null;
  
        setOverview(normalized);
        setRecent(Array.isArray(txData) ? txData : []);
        setPending(Array.isArray((pendingRes as any)?.data ?? (pendingRes as any)) ? ((pendingRes as any)?.data ?? (pendingRes as any)) : []);
        setPeriodic(Array.isArray((periodicRes as any)?.data ?? (periodicRes as any)) ? ((periodicRes as any)?.data ?? (periodicRes as any)) : []);
      }
    } catch (e: any) {
      setError(e?.message || 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    load();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const pieData = React.useMemo(() => {
    const funds = overview?.funds || [];
    const total = funds.reduce((s: number, f: any) => s + (f.current_value || 0), 0);
    if (!total) return [];
    return funds.map((f: any, idx: number) => ({
      x: f.ticker || f.name || `F${idx + 1}`,
      y: Math.max(0, Number((f.current_value || 0))),
    }));
  }, [overview]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#fff' }}
      contentContainerStyle={{ padding: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header numbers */}
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Card title="Tổng giá trị danh mục" value={formatCurrency(overview?.total_current_value || 0)} />
        <Card title="Số quỹ" value={String(overview?.funds?.length || 0)} />
        <Card title="Lãi/Lỗ" value={`${formatCurrency(overview?.total_profit_loss || 0)} (${formatPercent(overview?.total_profit_loss_percentage || 0)})`} />
      </View>

      {/* Charts and holdings */}
      <View style={{ marginTop: 16, padding: 12, borderRadius: 12, backgroundColor: '#fff', elevation: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>Phân bổ theo quỹ (%)</Text>
        {loading ? (
          <ActivityIndicator />
        ) : pieData.length ? (
          <VictoryPie
            data={pieData}
            innerRadius={70}
            colorScale={['#FF7A00', '#2D9CDB', '#27AE60', '#9B51E0', '#F2C94C']}
            labels={({ datum }: { datum: any }) => `${datum.x}`}
            padAngle={1}
          />
        ) : (
          <Text>Chưa có dữ liệu</Text>
        )}
      </View>

      {/* Holdings list (simple) */}
      <View style={{ marginTop: 16 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>Danh mục nắm giữ</Text>
        {(overview?.funds || []).map((f: any, i: number) => (
          <View key={i} style={{ padding: 12, borderRadius: 12, backgroundColor: '#fff', marginBottom: 8, elevation: 1 }}>
            <Text style={{ fontWeight: '600' }}>{f.ticker || f.name}</Text>
            <Text>Giá trị: {formatCurrency(f.current_value || 0)}</Text>
            <Text>NAV: {formatCurrency(f.current_nav || 0)}</Text>
          </View>
        ))}
        {!loading && !(overview?.funds || []).length ? <Text>Chưa có danh mục.</Text> : null}
      </View>

      {/* Recent transactions */}
      <View style={{ marginTop: 16, marginBottom: 24 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>Giao dịch gần nhất</Text>
        {recent.map((t: any, idx: number) => (
          <View key={idx} style={{ padding: 12, borderRadius: 12, backgroundColor: '#fff', marginBottom: 8, elevation: 1 }}>
            <Text style={{ fontWeight: '600' }}>{t.fund_name || t.name || 'Giao dịch'}</Text>
            <Text>Số tiền: {formatCurrency(t.amount || 0)}</Text>
            <Text>Trạng thái: {t.status || t.raw_status || '-'}</Text>
          </View>
        ))}
        {!loading && !recent.length ? <Text>Chưa có giao dịch.</Text> : null}
      </View>

      {/* Pending transactions */}
      <View style={{ marginTop: 16, marginBottom: 24 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>Giao dịch chờ xử lý</Text>
        {pending.map((t: any, idx: number) => (
          <View key={idx} style={{ padding: 12, borderRadius: 12, backgroundColor: '#fff', marginBottom: 8, elevation: 1 }}>
            <Text style={{ fontWeight: '600' }}>{t.fund_name || t.name || 'Giao dịch'}</Text>
            <Text>Số tiền: {formatCurrency(t.amount || 0)}</Text>
            <Text>Trạng thái: {t.status || t.raw_status || '-'}</Text>
          </View>
        ))}
        {!loading && !pending.length ? <Text>Không có giao dịch chờ.</Text> : null}
      </View>

      {/* Periodic transactions */}
      <View style={{ marginTop: 16, marginBottom: 24 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>Giao dịch định kỳ</Text>
        {periodic.map((t: any, idx: number) => (
          <View key={idx} style={{ padding: 12, borderRadius: 12, backgroundColor: '#fff', marginBottom: 8, elevation: 1 }}>
            <Text style={{ fontWeight: '600' }}>{t.fund_name || t.name || 'Giao dịch'}</Text>
            <Text>Số tiền: {formatCurrency(t.amount || 0)}</Text>
            <Text>Trạng thái: {t.status || t.raw_status || '-'}</Text>
          </View>
        ))}
        {!loading && !periodic.length ? <Text>Không có giao dịch định kỳ.</Text> : null}
      </View>

      {error ? <Text style={{ color: 'red', marginTop: 8 }}>{error}</Text> : null}
    </ScrollView>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <View style={{ flex: 1, padding: 12, borderRadius: 12, backgroundColor: '#fff', elevation: 1 }}>
      <Text style={{ color: '#666' }}>{title}</Text>
      <Text style={{ fontWeight: '700', fontSize: 16, marginTop: 4 }}>{value}</Text>
    </View>
  );
}


