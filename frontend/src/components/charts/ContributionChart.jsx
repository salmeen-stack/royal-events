import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatCurrency } from "../../utils/formatters";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl shadow-xl p-4 min-w-[180px]">
        <p className="text-sm font-bold text-gray-900 mb-3">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-3 text-sm mb-2 last:mb-0">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full shadow-sm"
                style={{ backgroundColor: entry.color }}
              />
              <span className="font-medium text-gray-700">{entry.name}</span>
            </div>
            <span className="font-bold text-gray-900">
              {formatCurrency(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const ContributionChart = ({ data = [] }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <p className="text-sm font-medium">No contribution data available</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart
        data={data}
        margin={{ top: 10, right: 20, left: 20, bottom: 10 }}
      >
        <defs>
          <linearGradient id="colorExpected" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorPaid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid 
          strokeDasharray="4 4" 
          stroke="#e2e8f0" 
          vertical={false}
        />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 12, fill: "#64748b", fontWeight: 500 }}
          tickLine={false}
          axisLine={false}
          dy={10}
        />
        <YAxis
          tick={{ fontSize: 12, fill: "#64748b", fontWeight: 500 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
          dx={-10}
        />
        <Tooltip 
          content={<CustomTooltip />}
          cursor={{ stroke: "#6366f1", strokeWidth: 2, strokeDasharray: "4 4" }}
        />
        <Legend
          wrapperStyle={{ fontSize: "13px", paddingTop: "16px", fontWeight: 500 }}
          iconType="circle"
          iconSize={10}
        />
        <Area
          type="monotone"
          dataKey="expected"
          name="Expected"
          stroke="#6366f1"
          strokeWidth={3}
          fill="url(#colorExpected)"
          dot={false}
          activeDot={{ r: 6, strokeWidth: 0, fill: "#6366f1" }}
          animationDuration={1500}
          animationEasing="ease-out"
        />
        <Area
          type="monotone"
          dataKey="paid"
          name="Paid"
          stroke="#10b981"
          strokeWidth={3}
          fill="url(#colorPaid)"
          dot={false}
          activeDot={{ r: 6, strokeWidth: 0, fill: "#10b981" }}
          animationDuration={1500}
          animationEasing="ease-out"
          animationBegin={300}
        />
        <Area
          type="monotone"
          dataKey="balance"
          name="Balance"
          stroke="#f59e0b"
          strokeWidth={3}
          fill="url(#colorBalance)"
          dot={false}
          activeDot={{ r: 6, strokeWidth: 0, fill: "#f59e0b" }}
          animationDuration={1500}
          animationEasing="ease-out"
          animationBegin={600}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default ContributionChart;