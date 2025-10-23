import { Paper, Typography, Grid, Box, Stack } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EmojiObjectsIcon from '@mui/icons-material/EmojiObjects';
import { EcmSummary } from '../-types/ecm.types';

interface EcmOverviewDashboardProps {
  summary: EcmSummary;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color,
  bgColor,
}) => {
  return (
    <Paper
      elevation={2}
      sx={{
        padding: 2.5,
        height: '100%',
        borderLeft: `4px solid ${color}`,
      }}
    >
      <Stack spacing={1}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="start"
        >
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            {title}
          </Typography>
          <Box
            sx={{
              backgroundColor: bgColor,
              borderRadius: 1,
              padding: 0.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
        </Stack>
        <Typography variant="h4" component="div" fontWeight="bold">
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Stack>
    </Paper>
  );
};

/**
 * ECM Overview Dashboard Component
 * Displays summary metrics for all ECMs
 */
export const EcmOverviewDashboard: React.FC<EcmOverviewDashboardProps> = ({
  summary,
}) => {
  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const formatEnergy = (value: number) => {
    return `${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  return (
    <Box>
      <Typography variant="h6" component="h2" gutterBottom sx={{ mb: 2 }}>
        ECM Overview
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            title="Total ECMs"
            value={summary.total_ecms}
            subtitle="Energy Conservation Measures"
            icon={
              <EmojiObjectsIcon sx={{ fontSize: 20, color: 'primary.main' }} />
            }
            color="primary.main"
            bgColor="primary.50"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            title="Total Implementation Cost"
            value={formatCurrency(summary.total_implementation_cost)}
            subtitle="Before incentives"
            icon={
              <AttachMoneyIcon sx={{ fontSize: 20, color: 'error.main' }} />
            }
            color="error.main"
            bgColor="error.50"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            title="Annual Cost Savings"
            value={formatCurrency(summary.total_annual_savings)}
            subtitle="Per year"
            icon={
              <TrendingUpIcon sx={{ fontSize: 20, color: 'success.main' }} />
            }
            color="success.main"
            bgColor="success.50"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            title="Total Incentives"
            value={formatCurrency(summary.total_incentives)}
            subtitle="Available rebates"
            icon={<LocalOfferIcon sx={{ fontSize: 20, color: 'info.main' }} />}
            color="info.main"
            bgColor="info.50"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            title="Average Payback Period"
            value={
              summary.average_payback_period === Infinity
                ? 'N/A'
                : `${summary.average_payback_period.toFixed(1)} yrs`
            }
            subtitle="Simple payback"
            icon={
              <AccessTimeIcon sx={{ fontSize: 20, color: 'warning.main' }} />
            }
            color="warning.main"
            bgColor="warning.50"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            title="Total Energy Savings"
            value={`${formatEnergy(summary.total_electricity_savings)} kWh`}
            subtitle={`${formatEnergy(summary.total_gas_savings)} therms gas`}
            icon={
              <TrendingUpIcon sx={{ fontSize: 20, color: 'success.main' }} />
            }
            color="success.main"
            bgColor="success.50"
          />
        </Grid>
      </Grid>
    </Box>
  );
};
