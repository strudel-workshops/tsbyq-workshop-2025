import { Paper, Typography, Grid, Box, Chip, Divider } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { LinearMeter } from '../../../components/LinearMeter';
import { LabelValueTable } from '../../../components/LabelValueTable';
import { EcmData } from '../-types/ecm.types';

interface AuditContextProps {
  ecmData: EcmData[];
}

/**
 * Audit Context Component
 * Displays audit-related information including type, completion date, ENERGY STAR score, and BPS compliance
 */
export const AuditContext: React.FC<AuditContextProps> = ({ ecmData }) => {
  if (!ecmData || ecmData.length === 0) return null;

  const firstEcm = ecmData[0];
  const auditType = firstEcm.audit_type;
  const auditCompletionDate = firstEcm.audit_completion_date;
  const energystarScoreAtAudit = firstEcm.energystar_score_at_audit;
  const auditForBpsCompliance = firstEcm.audit_for_bps_compliance;

  // Don't render if no audit data is present
  if (
    !auditType &&
    !auditCompletionDate &&
    !energystarScoreAtAudit &&
    auditForBpsCompliance === undefined
  ) {
    return null;
  }

  const auditRows = [
    auditType && { label: 'Audit Type', value: auditType },
    auditCompletionDate && {
      label: 'Completion Date',
      value: new Date(auditCompletionDate).toLocaleDateString(),
    },
    auditForBpsCompliance !== undefined && {
      label: 'BPS Compliance Related',
      value: (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {auditForBpsCompliance ? (
            <>
              <CheckCircleIcon sx={{ fontSize: 18, color: 'success.main' }} />
              <Typography variant="body2">Yes</Typography>
            </>
          ) : (
            <>
              <CancelIcon sx={{ fontSize: 18, color: 'error.main' }} />
              <Typography variant="body2">No</Typography>
            </>
          )}
        </Box>
      ),
    },
  ].filter(Boolean) as Array<{ label: string; value: React.ReactNode }>;

  return (
    <Paper elevation={2} sx={{ padding: 3 }}>
      <Typography variant="h6" component="h2" gutterBottom>
        Audit Context
      </Typography>
      <Divider sx={{ mb: 2 }} />

      <Grid container spacing={3}>
        {/* Audit Details */}
        <Grid item xs={12} md={energystarScoreAtAudit ? 8 : 12}>
          <LabelValueTable rows={auditRows} />
        </Grid>

        {/* ENERGY STAR Score */}
        {energystarScoreAtAudit && (
          <Grid item xs={12} md={4}>
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                ENERGY STAR Score at Audit
              </Typography>
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}
              >
                <Typography variant="h4" fontWeight="bold" color="primary.main">
                  {energystarScoreAtAudit}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  / 100
                </Typography>
              </Box>
              <Box sx={{ mt: 2 }}>
                <LinearMeter
                  value={energystarScoreAtAudit}
                  color={
                    energystarScoreAtAudit >= 75
                      ? 'success'
                      : energystarScoreAtAudit >= 50
                        ? 'warning'
                        : 'error'
                  }
                />
              </Box>
              <Box sx={{ mt: 1 }}>
                <Chip
                  label={
                    energystarScoreAtAudit >= 75
                      ? 'Excellent'
                      : energystarScoreAtAudit >= 50
                        ? 'Good'
                        : 'Needs Improvement'
                  }
                  size="small"
                  color={
                    energystarScoreAtAudit >= 75
                      ? 'success'
                      : energystarScoreAtAudit >= 50
                        ? 'warning'
                        : 'error'
                  }
                  sx={{ mt: 1 }}
                />
              </Box>
            </Box>
          </Grid>
        )}
      </Grid>
    </Paper>
  );
};
