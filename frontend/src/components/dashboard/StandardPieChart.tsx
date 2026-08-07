import React from 'react';
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieProps,
} from 'recharts';

interface StandardPieChartProps {
    data: any[];
    dataKey?: string;
    nameKey?: string;
    colors?: string[];
    height?: number;
    innerRadius?: number;
    outerRadius?: number;
    showLegend?: boolean;
    showLabels?: boolean;
    tooltipFormatter?: (value: any) => string | React.ReactNode;
}

const DEFAULT_COLORS = [
    'hsl(215, 80%, 45%)',
    'hsl(175, 60%, 45%)',
    'hsl(38, 95%, 55%)',
    'hsl(150, 60%, 45%)',
    'hsl(0, 75%, 55%)',
    'hsl(280, 65%, 55%)',
    'hsl(200, 80%, 50%)',
    'hsl(160, 60%, 40%)',
    'hsl(30, 90%, 50%)',
    'hsl(190, 70%, 45%)',
];

const renderCustomizedLabel = (props: any) => {
    const {
        cx,
        cy,
        midAngle,
        outerRadius,
        fill,
        payload,
        percent,
        value,
    } = props;

    if (percent === 0 || value === 0) return null;

    const RADIAN = Math.PI / 180;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 5) * cos;
    const sy = cy + (outerRadius + 5) * sin;
    const mx = cx + (outerRadius + 10) * cos;
    const my = cy + (outerRadius + 10) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 8;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    return (
        <g>
            <path
                d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`}
                stroke={fill}
                strokeWidth={1.5}
                fill="none"
                strokeLinecap="round"
                opacity={0.8}
            />
            <circle cx={ex} cy={ey} r={2} fill={fill} stroke="white" strokeWidth={1} />
            <text
                x={ex + (cos >= 0 ? 1 : -1) * 8}
                y={ey}
                textAnchor={textAnchor}
                fill="hsl(var(--foreground))"
                dominantBaseline="central"
                style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    filter: 'drop-shadow(0px 1px 1px rgba(0,0,0,0.05))'
                }}
            >
                {`${props.name} ${(percent * 100).toFixed(0)}%`}
            </text>
        </g>
    );
};

export function StandardPieChart({
    data,
    dataKey = 'count',
    nameKey = 'status',
    colors = DEFAULT_COLORS,
    height = 360,
    innerRadius = 55,
    outerRadius = 80,
    showLegend = false,
    showLabels = true,
    tooltipFormatter,
}: StandardPieChartProps) {
    const shouldShowLegend = showLegend || !showLabels;
    const shouldShowLabels = showLabels ? renderCustomizedLabel : undefined;

    const renderLegendText = (value: string, entry: any) => {
        const { payload } = entry;
        const total = data.reduce((sum, item) => sum + (item[dataKey] || 0), 0);
        const count = payload ? (payload[dataKey] || 0) : 0;
        const pct = total > 0 ? ((count / total) * 100).toFixed(0) : 0;
        return <span className="text-foreground font-medium text-xs ml-1">{value} ({pct}%)</span>;
    };

    return (
        <ResponsiveContainer width="100%" height={height}>
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={shouldShowLabels}
                    innerRadius={innerRadius}
                    outerRadius={outerRadius}
                    paddingAngle={4}
                    dataKey={dataKey}
                    nameKey={nameKey}
                    animationBegin={0}
                    animationDuration={800}
                >
                    {data.map((entry, index) => (
                        <Cell
                            key={`cell-${index}`}
                            fill={colors[index % colors.length]}
                            stroke="hsl(var(--background))"
                            strokeWidth={3}
                        />
                    ))}
                </Pie>
                <Tooltip
                    formatter={tooltipFormatter}
                    contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '15px'
                    }}
                />
                {shouldShowLegend && (
                    <Legend
                        verticalAlign="bottom"
                        align="center"
                        iconType="circle"
                        formatter={renderLegendText}
                        wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }}
                    />
                )}
            </PieChart>
        </ResponsiveContainer>
    );
}
