import { Card, CardContent, Divider, Grid, Stack, Typography, TextField, Alert, MenuItem } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import { IdentityDocumentType } from '../../resident/domain/valueObjects/IdentityDocumentType';

export const DOCUMENT_TYPE_OPTIONS = [
  { value: IdentityDocumentType.AADHAAR, label: 'Aadhaar' },
  { value: IdentityDocumentType.PAN, label: 'PAN' },
  { value: IdentityDocumentType.PASSPORT, label: 'Passport' },
  { value: IdentityDocumentType.DRIVING_LICENCE, label: 'Driving Licence' },
  { value: IdentityDocumentType.VOTER_ID, label: 'Voter ID' },
  { value: IdentityDocumentType.GOVERNMENT_ID, label: 'Government ID' },
  { value: IdentityDocumentType.OTHER, label: 'Other' },
];

export function toTitleCase(str: string): string {
  if (!str) return '';
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
}

interface ProspectDetailsCardProps {
  fullName: string;
  mobileNumber: string;
  idProofType?: string;
  customIdProofType?: string;
  idProofNumber?: string;
  onChangeFullName: (name: string) => void;
  onChangeMobileNumber: (mobile: string) => void;
  onChangeIdProofType?: (type: string) => void;
  onChangeCustomIdProofType?: (customType: string) => void;
  onChangeIdProofNumber?: (number: string) => void;
  duplicateCheckStatus?: {
    status: 'ACTIVE_BLOCK' | 'ON_NOTICE_BLOCK' | 'REUSE_ALLOW' | 'NEW';
    existingResident?: { residentCode: string; fullName: string };
    message?: string;
  };
}

export const ProspectDetailsCard: React.FC<ProspectDetailsCardProps> = ({
  fullName,
  mobileNumber,
  idProofType = IdentityDocumentType.AADHAAR,
  customIdProofType = '',
  idProofNumber = '',
  onChangeFullName,
  onChangeMobileNumber,
  onChangeIdProofType,
  onChangeCustomIdProofType,
  onChangeIdProofNumber,
  duplicateCheckStatus,
}) => {
  return (
    <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2 }}>
          <PersonIcon color="primary" fontSize="small" />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Prospect Identity Details
          </Typography>
        </Stack>

        <Stack spacing={2}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Full Name *"
                fullWidth
                size="small"
                value={fullName}
                onChange={(e) => onChangeFullName(toTitleCase(e.target.value))}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Mobile Number *"
                fullWidth
                size="small"
                value={mobileNumber}
                onChange={(e) => onChangeMobileNumber(e.target.value)}
                placeholder="10-digit mobile number"
              />
            </Grid>
          </Grid>

          {duplicateCheckStatus && duplicateCheckStatus.status !== 'NEW' && (
            <Alert
              severity={
                duplicateCheckStatus.status === 'ACTIVE_BLOCK' || duplicateCheckStatus.status === 'ON_NOTICE_BLOCK'
                  ? 'error'
                  : 'info'
              }
              sx={{ borderRadius: 1.5, py: 0.5, fontSize: '0.8125rem' }}
            >
              {duplicateCheckStatus.message}
            </Alert>
          )}

          <Divider />

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                label="Document Type"
                fullWidth
                size="small"
                value={idProofType || IdentityDocumentType.AADHAAR}
                onChange={(e) => {
                  const nextType = e.target.value;
                  if (onChangeIdProofType) onChangeIdProofType(nextType);
                  if (nextType !== IdentityDocumentType.OTHER && onChangeCustomIdProofType) {
                    onChangeCustomIdProofType('');
                  }
                }}
              >
                {DOCUMENT_TYPE_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Document No."
                fullWidth
                size="small"
                value={idProofNumber}
                onChange={(e) => onChangeIdProofNumber && onChangeIdProofNumber(e.target.value)}
                placeholder="e.g. 1234 5678 9012"
              />
            </Grid>

            {idProofType === IdentityDocumentType.OTHER && (
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Specify Document Type"
                  fullWidth
                  size="small"
                  value={customIdProofType}
                  onChange={(e) => onChangeCustomIdProofType && onChangeCustomIdProofType(e.target.value)}
                  placeholder="e.g. College ID, Employee Card, Birth Certificate"
                />
              </Grid>
            )}
          </Grid>
        </Stack>
      </CardContent>
    </Card>
  );
};
