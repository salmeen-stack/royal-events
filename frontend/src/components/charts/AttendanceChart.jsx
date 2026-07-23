import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const COLORS = ["#6366f1", "#e2e8f0"];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const percentage = payload[0].payload.percentage || 0;
    return (
      <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl shadow-xl p-4 min-w-[160px]">
        <p className="text-sm font-bold text-gray-900 mb-2">
          {payload[0].name}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Count:</span>
          <span className="font-bold text-gray-900">{payload[0].value}</span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-gray-600">Rate:</span>
          <span className="font-bold text-indigo-600">{percentage.toFixed(1)}%</span>
        </div>
      </div>
    );
  }
  return null;
};

const RADIAN = Math.PI / 180;
const renderCustomLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  if (percent < 0.05) return null;
  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={13}
      fontWeight={700}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const AttendanceChart = ({ checkedIn = 0, total = 0 }) => {
  const notCheckedIn = Math.max(0, total - checkedIn);
  const percentage = total > 0 ? (checkedIn / total) * 100 : 0;

  const data = [
    { name: "Checked In", value: checkedIn, percentage },
    { name: "Not Checked In", value: notCheckedIn, percentage: 100 - percentage },
  ];

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <p className="text-sm font-medium">No attendance data available</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={95}
          paddingAngle={4}
          dataKey="value"
          labelLine={false}
          label={renderCustomLabel}
          animationDuration={1500}
          animationEasing="ease-out"
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={COLORS[index % COLORS.length]}
              stroke="none"
              className="hover:opacity-80 transition-opacity duration-200"
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: "13px", paddingTop: "16px", fontWeight: 500 }}
          iconType="circle"
          iconSize={10}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default AttendanceChart;