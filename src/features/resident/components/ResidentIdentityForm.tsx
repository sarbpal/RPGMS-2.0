import React from 'react';
import {
  Box,
  TextField,
  MenuItem,
  Typography,
  Paper,
  Divider,
  FormControlLabel,
  Checkbox,
  Chip,
  Grid,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import BadgeIcon from '@mui/icons-material/Badge';
import HomeIcon from '@mui/icons-material/Home';
import ContactPhoneIcon from '@mui/icons-material/ContactPhone';
import WorkIcon from '@mui/icons-material/Work';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import FolderIcon from '@mui/icons-material/Folder';
import InfoIcon from '@mui/icons-material/Info';

export interface ResidentDocumentItem {
  id?: string;
  type: string;
  fileName: string;
  uploadDate?: string;
  uploadedBy?: string;
  verificationStatus: 'Pending Review' | 'Verified' | 'Rejected' | 'Not Applicable';
  remarks?: string;
}

export interface ResidentIdentityFormData {
  // Personal Identity
  id?: string;
  residentCode?: string;
  fullName: string;
  preferredName?: string;
  dateOfBirth?: string;
  gender?: string;
  photographUrl?: string;

  // Contact Information
  mobileNumber: string;
  alternateMobileNumber?: string;
  email?: string;

  // Government Identification
  idProofType: string;
  idProofNumber: string;

  // Address Information
  permanentAddressLine1?: string;
  permanentAddressLine2?: string;
  permanentLandmark?: string;
  permanentCity?: string;
  permanentState?: string;
  permanentPostalCode?: string;
  permanentCountry?: string;

  sameAsPermanentAddress?: boolean;

  localAddressLine1?: string;
  localAddressLine2?: string;
  localLandmark?: string;
  localCity?: string;
  localState?: string;
  localPostalCode?: string;
  localCountry?: string;

  // Emergency Contacts
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;

  // Professional Information
  occupationType?: string;
  collegeName?: string;
  course?: string;
  yearSemester?: string;
  collegeAddress?: string;
  companyName?: string;
  designation?: string;
  officeAddress?: string;
  businessName?: string;
  natureOfBusiness?: string;
  businessAddress?: string;

  // Medical Information
  bloodGroup?: string;
  medicalConditions?: string;
  allergies?: string;
  currentMedications?: string;
  medicalNotes?: string;

  // Resident Documents
  documents?: ResidentDocumentItem[];

  // System Generated Information
  status?: string;
  createdOn?: string;
  createdBy?: string;
  lastUpdatedOn?: string;
  lastUpdatedBy?: string;
  archived?: boolean;
  internalNotes?: string;
}

export interface ResidentIdentityFormProps {
  mode: 'onboarding' | 'profile';
  value: ResidentIdentityFormData;
  onChange: (value: ResidentIdentityFormData) => void;
  readOnly?: boolean;
  errors?: Record<string, string>;
}

const DOCUMENT_TYPES = [
  'Aadhaar',
  'PAN',
  'Passport',
  'Driving Licence',
  'Voter ID',
  'Other',
];

const OCCUPATION_TYPES = [
  'Student',
  'Working Professional',
  'Business Owner',
  'Self Employed',
  'Apprentice / Trainee',
  'Preparing for Competitive Examinations',
  'Other',
];

const EMERGENCY_RELATIONSHIPS = [
  'Father',
  'Mother',
  'Brother',
  'Sister',
  'Friend',
  'Relative',
  'Local Guardian',
  'Office Senior',
  'Employer',
  'Other',
];

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown / Not Provided'];

export const ResidentIdentityForm: React.FC<ResidentIdentityFormProps> = ({
  mode,
  value,
  onChange,
  readOnly = false,
  errors = {},
}) => {
  const handleChange = (field: keyof ResidentIdentityFormData, val: any) => {
    if (readOnly) return;
    onChange({
      ...value,
      [field]: val,
    });
  };

  const handleCopyPermanentToLocal = (checked: boolean) => {
    if (readOnly) return;
    if (checked) {
      onChange({
        ...value,
        sameAsPermanentAddress: true,
        localAddressLine1: value.permanentAddressLine1 || '',
        localAddressLine2: value.permanentAddressLine2 || '',
        localLandmark: value.permanentLandmark || '',
        localCity: value.permanentCity || '',
        localState: value.permanentState || '',
        localPostalCode: value.permanentPostalCode || '',
        localCountry: value.permanentCountry || 'India',
      });
    } else {
      onChange({
        ...value,
        sameAsPermanentAddress: false,
      });
    }
  };

  // Mode 1: Onboarding Mode (Strictly 4 Mandatory Fields)
  if (mode === 'onboarding') {
    return (
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
        <TextField
          label="Resident Name *"
          size="small"
          disabled={readOnly}
          value={value.fullName || ''}
          onChange={(e) => handleChange('fullName', e.target.value)}
          error={Boolean(errors.fullName)}
          helperText={errors.fullName}
          slotProps={{
            input: {
              startAdornment: <PersonIcon fontSize="small" sx={{ mr: 1, color: '#94a3b8' }} />,
            },
          }}
        />

        <TextField
          label="Mobile Number *"
          size="small"
          disabled={readOnly}
          value={value.mobileNumber || ''}
          onChange={(e) => handleChange('mobileNumber', e.target.value)}
          error={Boolean(errors.mobileNumber)}
          helperText={errors.mobileNumber}
          slotProps={{
            input: {
              startAdornment: <PhoneIcon fontSize="small" sx={{ mr: 1, color: '#94a3b8' }} />,
            },
          }}
        />

        <TextField
          select
          label="Government Document Type *"
          size="small"
          disabled={readOnly}
          value={value.idProofType || 'Aadhaar'}
          onChange={(e) => handleChange('idProofType', e.target.value)}
          error={Boolean(errors.idProofType)}
          helperText={errors.idProofType}
        >
          {DOCUMENT_TYPES.map((type) => (
            <MenuItem key={type} value={type}>
              {type}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label="Government Document Number *"
          size="small"
          disabled={readOnly}
          placeholder="e.g. 1234-5678-9012"
          value={value.idProofNumber || ''}
          onChange={(e) => handleChange('idProofNumber', e.target.value)}
          error={Boolean(errors.idProofNumber)}
          helperText={errors.idProofNumber}
          slotProps={{
            input: {
              startAdornment: <BadgeIcon fontSize="small" sx={{ mr: 1, color: '#94a3b8' }} />,
            },
          }}
        />
      </Box>
    );
  }

  // Mode 2: Complete Resident Profile Mode (All 9 Specification Sections)
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* 1. Personal Identity */}
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: '1px solid #e2e8f0' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <PersonIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
            1. Personal Identity
          </Typography>
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2 }}>
          <TextField
            label="Full Name *"
            size="small"
            disabled={readOnly}
            value={value.fullName || ''}
            onChange={(e) => handleChange('fullName', e.target.value)}
            error={Boolean(errors.fullName)}
            helperText={errors.fullName}
          />
          <TextField
            label="Preferred Display Name"
            size="small"
            disabled={readOnly}
            value={value.preferredName || ''}
            onChange={(e) => handleChange('preferredName', e.target.value)}
          />
          <TextField
            label="Date of Birth"
            type="date"
            size="small"
            disabled={readOnly}
            value={value.dateOfBirth || ''}
            onChange={(e) => handleChange('dateOfBirth', e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            select
            label="Gender"
            size="small"
            disabled={readOnly}
            value={value.gender || 'Male'}
            onChange={(e) => handleChange('gender', e.target.value)}
          >
            <MenuItem value="Male">Male</MenuItem>
            <MenuItem value="Female">Female</MenuItem>
            <MenuItem value="Other">Other</MenuItem>
          </TextField>
          <TextField
            label="Photograph URL"
            size="small"
            disabled={readOnly}
            placeholder="https://..."
            value={value.photographUrl || ''}
            onChange={(e) => handleChange('photographUrl', e.target.value)}
          />
        </Box>
      </Paper>

      {/* 2. Contact Information */}
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: '1px solid #e2e8f0' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <PhoneIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
            2. Contact Information
          </Typography>
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2 }}>
          <TextField
            label="Primary Mobile Number *"
            size="small"
            disabled={readOnly}
            value={value.mobileNumber || ''}
            onChange={(e) => handleChange('mobileNumber', e.target.value)}
            error={Boolean(errors.mobileNumber)}
            helperText={errors.mobileNumber}
          />
          <TextField
            label="Alternate Mobile Number"
            size="small"
            disabled={readOnly}
            value={value.alternateMobileNumber || ''}
            onChange={(e) => handleChange('alternateMobileNumber', e.target.value)}
          />
          <TextField
            label="Email Address"
            type="email"
            size="small"
            disabled={readOnly}
            value={value.email || ''}
            onChange={(e) => handleChange('email', e.target.value)}
          />
        </Box>
      </Paper>

      {/* 3. Government Identification */}
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: '1px solid #e2e8f0' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <BadgeIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
            3. Government Identification
          </Typography>
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
          <TextField
            select
            label="Government Document Type *"
            size="small"
            disabled={readOnly}
            value={value.idProofType || 'Aadhaar'}
            onChange={(e) => handleChange('idProofType', e.target.value)}
          >
            {DOCUMENT_TYPES.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Government Document Number *"
            size="small"
            disabled={readOnly}
            value={value.idProofNumber || ''}
            onChange={(e) => handleChange('idProofNumber', e.target.value)}
          />
        </Box>
      </Paper>

      {/* 4. Address Information */}
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: '1px solid #e2e8f0' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <HomeIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
            4. Address Information
          </Typography>
        </Box>
        
        {/* Permanent Address */}
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#475569', mb: 1.5 }}>
          Permanent Address
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
          <TextField
            label="Address Line 1"
            size="small"
            disabled={readOnly}
            value={value.permanentAddressLine1 || ''}
            onChange={(e) => handleChange('permanentAddressLine1', e.target.value)}
          />
          <TextField
            label="Address Line 2"
            size="small"
            disabled={readOnly}
            value={value.permanentAddressLine2 || ''}
            onChange={(e) => handleChange('permanentAddressLine2', e.target.value)}
          />
          <TextField
            label="Landmark"
            size="small"
            disabled={readOnly}
            value={value.permanentLandmark || ''}
            onChange={(e) => handleChange('permanentLandmark', e.target.value)}
          />
          <TextField
            label="City"
            size="small"
            disabled={readOnly}
            value={value.permanentCity || ''}
            onChange={(e) => handleChange('permanentCity', e.target.value)}
          />
          <TextField
            label="State / Province"
            size="small"
            disabled={readOnly}
            value={value.permanentState || ''}
            onChange={(e) => handleChange('permanentState', e.target.value)}
          />
          <TextField
            label="Postal Code"
            size="small"
            disabled={readOnly}
            value={value.permanentPostalCode || ''}
            onChange={(e) => handleChange('permanentPostalCode', e.target.value)}
          />
          <TextField
            label="Country"
            size="small"
            disabled={readOnly}
            value={value.permanentCountry || 'India'}
            onChange={(e) => handleChange('permanentCountry', e.target.value)}
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Local Contact Address */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#475569' }}>
            Local Contact Address (Optional)
          </Typography>
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                disabled={readOnly}
                checked={Boolean(value.sameAsPermanentAddress)}
                onChange={(e) => handleCopyPermanentToLocal(e.target.checked)}
              />
            }
            label={<Typography variant="caption" sx={{ fontWeight: 600 }}>Same as Permanent Address</Typography>}
          />
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
          <TextField
            label="Address Line 1"
            size="small"
            disabled={readOnly || value.sameAsPermanentAddress}
            value={value.localAddressLine1 || ''}
            onChange={(e) => handleChange('localAddressLine1', e.target.value)}
          />
          <TextField
            label="Address Line 2"
            size="small"
            disabled={readOnly || value.sameAsPermanentAddress}
            value={value.localAddressLine2 || ''}
            onChange={(e) => handleChange('localAddressLine2', e.target.value)}
          />
          <TextField
            label="Landmark"
            size="small"
            disabled={readOnly || value.sameAsPermanentAddress}
            value={value.localLandmark || ''}
            onChange={(e) => handleChange('localLandmark', e.target.value)}
          />
          <TextField
            label="City"
            size="small"
            disabled={readOnly || value.sameAsPermanentAddress}
            value={value.localCity || ''}
            onChange={(e) => handleChange('localCity', e.target.value)}
          />
          <TextField
            label="State / Province"
            size="small"
            disabled={readOnly || value.sameAsPermanentAddress}
            value={value.localState || ''}
            onChange={(e) => handleChange('localState', e.target.value)}
          />
          <TextField
            label="Postal Code"
            size="small"
            disabled={readOnly || value.sameAsPermanentAddress}
            value={value.localPostalCode || ''}
            onChange={(e) => handleChange('localPostalCode', e.target.value)}
          />
        </Box>
      </Paper>

      {/* 5. Emergency Contacts */}
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: '1px solid #e2e8f0' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <ContactPhoneIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
            5. Emergency Contacts
          </Typography>
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2 }}>
          <TextField
            label="Emergency Contact Name *"
            size="small"
            disabled={readOnly}
            value={value.emergencyContactName || ''}
            onChange={(e) => handleChange('emergencyContactName', e.target.value)}
            error={Boolean(errors.emergencyContactName)}
            helperText={errors.emergencyContactName}
          />
          <TextField
            label="Emergency Contact Phone *"
            size="small"
            disabled={readOnly}
            value={value.emergencyContactPhone || ''}
            onChange={(e) => handleChange('emergencyContactPhone', e.target.value)}
            error={Boolean(errors.emergencyContactPhone)}
            helperText={errors.emergencyContactPhone}
          />
          <TextField
            select
            label="Relationship *"
            size="small"
            disabled={readOnly}
            value={value.emergencyContactRelationship || 'Father'}
            onChange={(e) => handleChange('emergencyContactRelationship', e.target.value)}
          >
            {EMERGENCY_RELATIONSHIPS.map((rel) => (
              <MenuItem key={rel} value={rel}>
                {rel}
              </MenuItem>
            ))}
          </TextField>
        </Box>
      </Paper>

      {/* 6. Professional Information */}
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: '1px solid #e2e8f0' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <WorkIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
            6. Professional Information
          </Typography>
        </Box>
        <Box sx={{ mb: 2 }}>
          <TextField
            select
            label="Occupation Type *"
            size="small"
            fullWidth
            disabled={readOnly}
            value={value.occupationType || 'Student'}
            onChange={(e) => handleChange('occupationType', e.target.value)}
          >
            {OCCUPATION_TYPES.map((occ) => (
              <MenuItem key={occ} value={occ}>
                {occ}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        {/* Conditional sub-fields */}
        {value.occupationType === 'Student' && (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <TextField
              label="College / Institution Name *"
              size="small"
              disabled={readOnly}
              value={value.collegeName || ''}
              onChange={(e) => handleChange('collegeName', e.target.value)}
            />
            <TextField
              label="Course / Degree *"
              size="small"
              disabled={readOnly}
              value={value.course || ''}
              onChange={(e) => handleChange('course', e.target.value)}
            />
            <TextField
              label="Year / Semester"
              size="small"
              disabled={readOnly}
              value={value.yearSemester || ''}
              onChange={(e) => handleChange('yearSemester', e.target.value)}
            />
            <TextField
              label="College Address"
              size="small"
              disabled={readOnly}
              value={value.collegeAddress || ''}
              onChange={(e) => handleChange('collegeAddress', e.target.value)}
            />
          </Box>
        )}

        {value.occupationType === 'Working Professional' && (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <TextField
              label="Company / Employer Name *"
              size="small"
              disabled={readOnly}
              value={value.companyName || ''}
              onChange={(e) => handleChange('companyName', e.target.value)}
            />
            <TextField
              label="Designation / Role *"
              size="small"
              disabled={readOnly}
              value={value.designation || ''}
              onChange={(e) => handleChange('designation', e.target.value)}
            />
            <TextField
              label="Office Address"
              size="small"
              disabled={readOnly}
              value={value.officeAddress || ''}
              onChange={(e) => handleChange('officeAddress', e.target.value)}
            />
          </Box>
        )}

        {(value.occupationType === 'Business Owner' || value.occupationType === 'Self Employed') && (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <TextField
              label="Business / Enterprise Name *"
              size="small"
              disabled={readOnly}
              value={value.businessName || ''}
              onChange={(e) => handleChange('businessName', e.target.value)}
            />
            <TextField
              label="Nature of Business"
              size="small"
              disabled={readOnly}
              value={value.natureOfBusiness || ''}
              onChange={(e) => handleChange('natureOfBusiness', e.target.value)}
            />
            <TextField
              label="Business Address"
              size="small"
              disabled={readOnly}
              value={value.businessAddress || ''}
              onChange={(e) => handleChange('businessAddress', e.target.value)}
            />
          </Box>
        )}
      </Paper>

      {/* 7. Medical Information */}
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: '1px solid #e2e8f0' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <MedicalServicesIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
            7. Medical Information (Voluntary)
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
          Recorded only if voluntarily provided by the resident for emergency support.
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2 }}>
          <TextField
            select
            label="Blood Group"
            size="small"
            disabled={readOnly}
            value={value.bloodGroup || 'Unknown / Not Provided'}
            onChange={(e) => handleChange('bloodGroup', e.target.value)}
          >
            {BLOOD_GROUPS.map((bg) => (
              <MenuItem key={bg} value={bg}>
                {bg}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Known Medical Conditions"
            size="small"
            disabled={readOnly}
            value={value.medicalConditions || ''}
            onChange={(e) => handleChange('medicalConditions', e.target.value)}
          />
          <TextField
            label="Known Allergies"
            size="small"
            disabled={readOnly}
            value={value.allergies || ''}
            onChange={(e) => handleChange('allergies', e.target.value)}
          />
          <TextField
            label="Current Medications"
            size="small"
            disabled={readOnly}
            value={value.currentMedications || ''}
            onChange={(e) => handleChange('currentMedications', e.target.value)}
          />
          <TextField
            label="Medical Notes"
            size="small"
            multiline
            rows={2}
            disabled={readOnly}
            value={value.medicalNotes || ''}
            onChange={(e) => handleChange('medicalNotes', e.target.value)}
            sx={{ gridColumn: { sm: 'span 2' } }}
          />
        </Box>
      </Paper>

      {/* 8. Resident Documents */}
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: '1px solid #e2e8f0' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <FolderIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
            8. Resident Documents
          </Typography>
        </Box>
        {value.documents && value.documents.length > 0 ? (
          <Grid container spacing={2}>
            {value.documents.map((doc, idx) => (
              <Grid size={{ xs: 12, sm: 6 }} key={doc.id || idx}>
                <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, bgcolor: '#f8fafc', border: '1px solid #cbd5e1' }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {doc.type}: {doc.fileName}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <Chip
                      label={doc.verificationStatus}
                      size="small"
                      color={doc.verificationStatus === 'Verified' ? 'success' : 'warning'}
                    />
                    {doc.uploadDate && (
                      <Typography variant="caption" color="text.secondary">
                        Uploaded: {doc.uploadDate}
                      </Typography>
                    )}
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Box sx={{ textAlign: 'center', py: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px dashed #cbd5e1' }}>
            <Typography variant="body2" color="text.secondary">
              No digital documents uploaded yet. Document files are managed separately from government ID numbers.
            </Typography>
          </Box>
        )}
      </Paper>

      {/* 9. System Generated Information */}
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <InfoIcon color="action" />
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#475569' }}>
            9. System Generated Information (Read-Only)
          </Typography>
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2, mb: 2 }}>
          <TextField
            label="Resident ID / Code"
            size="small"
            disabled
            value={value.residentCode || value.id || 'Generated upon admission'}
          />
          <TextField
            label="Resident Operational Status"
            size="small"
            disabled
            value={value.status || 'ACTIVE'}
          />
          <TextField
            label="Created On"
            size="small"
            disabled
            value={value.createdOn || new Date().toISOString().split('T')[0]}
          />
        </Box>
        <TextField
          label="Internal Administrative Notes"
          size="small"
          multiline
          rows={2}
          disabled={readOnly}
          placeholder="Private operational notes..."
          value={value.internalNotes || ''}
          onChange={(e) => handleChange('internalNotes', e.target.value)}
          fullWidth
        />
      </Paper>
    </Box>
  );
};
