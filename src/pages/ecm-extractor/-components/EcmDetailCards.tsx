import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Grid,
  Box,
  Chip,
  Divider,
  Stack,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { EcmTableRow } from '../-types/ecm.types';
import { LabelValueTable } from '../../../components/LabelValueTable';

interface EcmDetailCardsProps {
  ecms: EcmTableRow[];
}

/**
 * ECM Detail Cards Component
 * Displays detailed information for each ECM in an accordion format
 */
export const EcmDetailCards: React.FC<EcmDetailCardsProps> = ({ ecms }) => {
  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const formatEnergy = (value: number) => {
    return value > 0 ? `${value.toLocaleString()} ` : '-';
  };

  return (
    <Box>
      <Typography variant="h6" component="h2" gutterBottom sx={{ mb: 2 }}>
        Detailed ECM Information
      </Typography>
      <Stack spacing={2}>
        {ecms.map((ecm, index) => (
          <Accordion key={ecm.id} defaultExpanded={index === 0}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls={`ecm-${ecm.id}-content`}
              id={`ecm-${ecm.id}-header`}
            >
              <Stack
                direction="row"
                spacing={2}
                alignItems="center"
                width="100%"
              >
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                  {ecm.ecm_name}
                </Typography>
                <Chip
                  label={ecm.ecm_status}
                  color="primary"
                  size="small"
                  sx={{ mr: 1 }}
                />
                {ecm.simple_payback !== Infinity && ecm.simple_payback > 0 && (
                  <Chip
                    label={`${ecm.simple_payback.toFixed(1)} yr payback`}
                    color={
                      ecm.simple_payback < 5
                        ? 'success'
                        : ecm.simple_payback < 10
                          ? 'warning'
                          : 'error'
                    }
                    size="small"
                    variant="outlined"
                  />
                )}
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                {/* Description */}
                <Grid item xs={12}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Description
                  </Typography>
                  <Typography variant="body1" paragraph>
                    {ecm.ecm_description}
                  </Typography>
                  {ecm.ecm_additional_details && (
                    <Box
                      sx={{
                        backgroundColor: 'grey.100',
                        padding: 2,
                        borderRadius: 1,
                        mt: 1,
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        <strong>Additional Details:</strong>{' '}
                        {ecm.ecm_additional_details}
                      </Typography>
                    </Box>
                  )}
                </Grid>

                <Grid item xs={12}>
                  <Divider />
                </Grid>

                {/* Cost Analysis */}
                <Grid item xs={12} md={6}>
                  <Typography
                    variant="subtitle1"
                    gutterBottom
                    fontWeight="bold"
                  >
                    Cost Analysis
                  </Typography>
                  <LabelValueTable
                    rows={[
                      {
                        label: 'Implementation Cost',
                        value: formatCurrency(ecm.implementation_cost),
                      },
                      {
                        label: 'Incentives Available',
                        value:
                          ecm.incentives > 0
                            ? formatCurrency(ecm.incentives)
                            : '-',
                      },
                      {
                        label: 'Net Cost',
                        value: formatCurrency(
                          ecm.implementation_cost - ecm.incentives
                        ),
                      },
                      {
                        label: 'Annual Savings',
                        value: formatCurrency(ecm.annual_cost_savings),
                      },
                      {
                        label: 'Simple Payback',
                        value:
                          ecm.simple_payback === Infinity ||
                          ecm.simple_payback < 0
                            ? 'N/A'
                            : `${ecm.simple_payback.toFixed(1)} years`,
                      },
                      {
                        label: 'Lifetime',
                        value: `${ecm.lifetime} years`,
                      },
                      {
                        label: 'Lifetime Savings',
                        value: formatCurrency(
                          ecm.annual_cost_savings * ecm.lifetime
                        ),
                      },
                    ]}
                  />
                </Grid>

                {/* Energy Savings */}
                <Grid item xs={12} md={6}>
                  <Typography
                    variant="subtitle1"
                    gutterBottom
                    fontWeight="bold"
                  >
                    Energy Savings
                  </Typography>
                  <LabelValueTable
                    rows={[
                      {
                        label: 'Electricity',
                        value:
                          ecm.electricity_savings > 0
                            ? `${formatEnergy(ecm.electricity_savings)}kWh/year`
                            : '-',
                      },
                      {
                        label: 'Natural Gas',
                        value:
                          ecm.gas_savings > 0
                            ? `${formatEnergy(ecm.gas_savings)}therms/year`
                            : '-',
                      },
                      {
                        label: 'Lifetime Electricity',
                        value:
                          ecm.electricity_savings > 0
                            ? `${formatEnergy(ecm.electricity_savings * ecm.lifetime)}kWh`
                            : '-',
                      },
                      {
                        label: 'Lifetime Natural Gas',
                        value:
                          ecm.gas_savings > 0
                            ? `${formatEnergy(ecm.gas_savings * ecm.lifetime)}therms`
                            : '-',
                      },
                    ]}
                  />
                </Grid>

                {/* Financial Summary */}
                {ecm.simple_payback !== Infinity && ecm.simple_payback > 0 && (
                  <Grid item xs={12}>
                    <Box
                      sx={{
                        backgroundColor: 'success.50',
                        padding: 2,
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'success.main',
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        color="success.dark"
                        gutterBottom
                      >
                        <strong>Financial Summary</strong>
                      </Typography>
                      <Typography variant="body2" color="success.dark">
                        With an implementation cost of{' '}
                        {formatCurrency(ecm.implementation_cost)}
                        {ecm.incentives > 0 &&
                          ` (net ${formatCurrency(ecm.implementation_cost - ecm.incentives)} after incentives)`}
                        , this measure will save{' '}
                        {formatCurrency(ecm.annual_cost_savings)} annually and
                        pay for itself in approximately{' '}
                        {ecm.simple_payback.toFixed(1)} years. Over its{' '}
                        {ecm.lifetime}-year lifetime, total savings are
                        estimated at{' '}
                        {formatCurrency(ecm.annual_cost_savings * ecm.lifetime)}
                        .
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </AccordionDetails>
          </Accordion>
        ))}
      </Stack>
    </Box>
  );
};
