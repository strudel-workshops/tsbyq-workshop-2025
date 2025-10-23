import { Paper, Typography, Grid, Box, Divider } from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { EcmTableRow } from '../-types/ecm.types';

interface EcmChartsProps {
  ecms: EcmTableRow[];
}

const COLORS = [
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#8884d8',
  '#82ca9d',
];

/**
 * ECM Charts Component
 * Displays visual charts for cost and energy savings analysis
 */
export const EcmCharts: React.FC<EcmChartsProps> = ({ ecms }) => {
  // Prepare data for cost savings chart
  const costSavingsData = ecms.map((ecm) => ({
    name: ecm.ecm_name,
    savings: ecm.annual_cost_savings,
  }));

  // Prepare data for implementation cost pie chart
  const implementationCostData = ecms.map((ecm) => ({
    name: ecm.ecm_name,
    value: ecm.implementation_cost,
  }));

  // Prepare data for energy savings chart
  const energySavingsData = ecms.map((ecm) => ({
    name: ecm.ecm_name,
    electricity: ecm.electricity_savings,
    gas: ecm.gas_savings,
  }));

  // Prepare data for payback comparison
  const paybackData = ecms
    .filter((ecm) => ecm.simple_payback !== Infinity && ecm.simple_payback > 0)
    .map((ecm) => ({
      name: ecm.ecm_name,
      payback: ecm.simple_payback,
    }))
    .sort((a, b) => a.payback - b.payback);

  const formatCurrency = (value: number) => {
    return `$${(value / 1000).toFixed(0)}K`;
  };

  const formatEnergy = (value: number) => {
    return value >= 1000 ? `${(value / 1000).toFixed(0)}K` : value.toFixed(0);
  };

  return (
    <Box>
      <Typography variant="h6" component="h2" gutterBottom sx={{ mb: 2 }}>
        Visual Analysis
      </Typography>
      <Grid container spacing={3}>
        {/* Annual Cost Savings Chart */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ padding: 3 }}>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Annual Cost Savings by ECM
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={costSavingsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  interval={0}
                  tick={{ fontSize: 12 }}
                />
                <YAxis tickFormatter={formatCurrency} />
                <Tooltip
                  formatter={(value: number) => [
                    `$${value.toLocaleString()}`,
                    'Annual Savings',
                  ]}
                />
                <Legend />
                <Bar
                  dataKey="savings"
                  fill="#00C49F"
                  name="Annual Savings ($)"
                />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Implementation Cost Distribution */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ padding: 3 }}>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Implementation Cost Distribution
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={implementationCostData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: any) => entry.name}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {implementationCostData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [
                    `$${value.toLocaleString()}`,
                    'Cost',
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Energy Savings by Fuel Type */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ padding: 3 }}>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Energy Savings by Fuel Type
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={energySavingsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  interval={0}
                  tick={{ fontSize: 12 }}
                />
                <YAxis tickFormatter={formatEnergy} />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    value.toLocaleString(),
                    name === 'electricity'
                      ? 'Electricity (kWh)'
                      : 'Natural Gas (therms)',
                  ]}
                />
                <Legend />
                <Bar
                  dataKey="electricity"
                  fill="#0088FE"
                  name="Electricity (kWh)"
                />
                <Bar dataKey="gas" fill="#FF8042" name="Natural Gas (therms)" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Payback Period Comparison */}
        {paybackData.length > 0 && (
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ padding: 3 }}>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                Simple Payback Period Comparison
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={paybackData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    label={{ value: 'Years', position: 'bottom' }}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={120}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(value: number) => [
                      `${value.toFixed(1)} years`,
                      'Payback Period',
                    ]}
                  />
                  <Legend />
                  <Bar
                    dataKey="payback"
                    fill="#FFBB28"
                    name="Payback Period (years)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};
