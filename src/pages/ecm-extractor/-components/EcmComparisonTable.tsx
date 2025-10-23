import { Paper, Typography, Divider, Chip, Box } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { SciDataGrid } from '../../../components/SciDataGrid';
import { EcmTableRow } from '../-types/ecm.types';

interface EcmComparisonTableProps {
  ecms: EcmTableRow[];
}

/**
 * ECM Comparison Table Component
 * Displays a sortable/filterable table of all ECMs
 */
export const EcmComparisonTable: React.FC<EcmComparisonTableProps> = ({
  ecms,
}) => {
  const columns: GridColDef[] = [
    {
      field: 'ecm_name',
      headerName: 'ECM Name',
      flex: 1,
      minWidth: 180,
    },
    {
      field: 'ecm_status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={params.value === 'Identified' ? 'primary' : 'default'}
        />
      ),
    },
    {
      field: 'implementation_cost',
      headerName: 'Implementation Cost',
      width: 160,
      type: 'number',
      valueFormatter: (value: number) =>
        `$${value?.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
    },
    {
      field: 'annual_cost_savings',
      headerName: 'Annual Savings',
      width: 140,
      type: 'number',
      valueFormatter: (value: number) =>
        `$${value?.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
    },
    {
      field: 'incentives',
      headerName: 'Incentives',
      width: 120,
      type: 'number',
      valueFormatter: (value: number) =>
        value > 0
          ? `$${value?.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
          : '-',
    },
    {
      field: 'simple_payback',
      headerName: 'Payback (yrs)',
      width: 130,
      type: 'number',
      valueFormatter: (value: number) =>
        value === Infinity || value < 0 ? 'N/A' : value?.toFixed(1),
      renderCell: (params) => {
        const value = params.value;
        const color =
          value === Infinity || value < 0
            ? 'default'
            : value < 5
              ? 'success'
              : value < 10
                ? 'warning'
                : 'error';
        return (
          <Chip
            label={
              value === Infinity || value < 0
                ? 'N/A'
                : `${value.toFixed(1)} yrs`
            }
            size="small"
            color={color}
            variant="outlined"
          />
        );
      },
    },
    {
      field: 'electricity_savings',
      headerName: 'Electricity (kWh)',
      width: 140,
      type: 'number',
      valueFormatter: (value: number) =>
        value > 0
          ? value?.toLocaleString(undefined, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })
          : '-',
    },
    {
      field: 'gas_savings',
      headerName: 'Gas (therms)',
      width: 130,
      type: 'number',
      valueFormatter: (value: number) =>
        value > 0
          ? value?.toLocaleString(undefined, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })
          : '-',
    },
    {
      field: 'demand_savings',
      headerName: 'Demand (kW)',
      width: 120,
      type: 'number',
      valueFormatter: (value: number) =>
        value > 0
          ? value?.toLocaleString(undefined, {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            })
          : '-',
    },
    {
      field: 'lifetime',
      headerName: 'Lifetime (yrs)',
      width: 120,
      type: 'number',
    },
  ];

  return (
    <Paper
      elevation={2}
      sx={{
        padding: 3,
      }}
    >
      <Typography variant="h6" component="h2" gutterBottom>
        ECM Comparison
      </Typography>
      <Divider sx={{ mb: 2 }} />
      <Box sx={{ height: 500, width: '100%' }}>
        <SciDataGrid
          rows={ecms}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 10 },
            },
            sorting: {
              sortModel: [{ field: 'simple_payback', sort: 'asc' }],
            },
          }}
          pageSizeOptions={[5, 10, 25]}
          disableRowSelectionOnClick
        />
      </Box>
    </Paper>
  );
};
