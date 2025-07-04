import React from 'react';
import { DetailsContainer, Segment, FullWidth } from '@/assets/styles/general/tool.styles';
import { MODELS, COMPONENTS, RELATIONSHIPS, REGISTRANTS } from '../../../constants/navigator';
import { FormatStructuredData, reorderObjectProperties } from '@/components/DataFormatter';
import {
  FormControl,
  Select,
  MenuItem,
  CircularProgress,
  useTheme,
  Button,
} from '@sistent/sistent';
import DownloadIcon from '@mui/icons-material/Download';
import { REGISTRY_ITEM_STATES } from '@/utils/Enum';
// import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
// import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import {
  useUpdateEntityStatusMutation,
  useGetComponentsQuery,
  useGetMeshModelsQuery,
} from '@/rtk-query/meshModel';
import _ from 'lodash';
import { JustifyAndAlignCenter } from './MeshModel.style';
import { reactJsonTheme } from './helper';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Accordion, AccordionDetails, AccordionSummary, styled } from '@sistent/sistent';
import dynamic from 'next/dynamic';

import {
  StyledKeyValueFormattedValue,
  StyledKeyValuePropertyDiv,
  StyledKeyValueProperty,
} from './MeshModel.style';
import { iconSmall } from 'css/icons.styles';
const ReactJson = dynamic(() => import('react-json-view'), { ssr: false });

const ExportAvailable = true;
const KeyValue = ({ property, value }) => {
  let formattedValue = value;

  if (Array.isArray(value)) {
    formattedValue = value.join(', ');
  }

  return (
    <StyledKeyValuePropertyDiv>
      <StyledKeyValueProperty>{property}</StyledKeyValueProperty>
      <StyledKeyValueFormattedValue>{formattedValue}</StyledKeyValueFormattedValue>
    </StyledKeyValuePropertyDiv>
  );
};

const StyledTitle = styled('div')(({ theme }) => ({
  fontSize: '1.25rem',
  fontFamily: theme.typography.fontFamily,
  textAlign: 'left',
  lineHeight: '1.3rem',
}));

const RenderContents = ({
  metaDataLeft,
  metaDataRight,
  PropertyFormattersLeft,
  PropertyFormattersRight,
  orderLeft,
  orderRight,
  jsonData,
}) => {
  const theme = useTheme();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Segment>
        <FullWidth style={{ display: 'flex', flexDirection: 'column', paddingRight: '1rem' }}>
          <FormatStructuredData
            data={reorderObjectProperties(metaDataLeft, orderLeft)}
            propertyFormatters={PropertyFormattersLeft}
            order={orderLeft}
          />
        </FullWidth>
        <FullWidth style={{ display: 'flex', flexDirection: 'column' }}>
          <FormatStructuredData
            data={reorderObjectProperties(metaDataRight, orderRight)}
            propertyFormatters={PropertyFormattersRight}
            order={orderRight}
          />
        </FullWidth>
      </Segment>
      {jsonData && (
        <Accordion
          style={{
            borderRadius: '6px',
            color: theme.palette.text.default,
            margin: '0 -1rem',
            padding: '0',
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon style={{ fill: theme.palette.text.default }} />}
          >
            Advanced Details
          </AccordionSummary>
          <AccordionDetails
            style={{
              padding: '0',
              fontSize: '0.85rem',
            }}
          >
            <ReactJson
              theme={reactJsonTheme(theme.palette.mode)}
              name={false}
              displayDataTypes={false}
              iconStyle="circle"
              src={jsonData}
              style={{
                fontSize: '.85rem',
                minHeight: 'inherit',
                padding: '1.1rem',
                margin: '0rem',
              }}
              collapsed={1} // expanded upto 1 level
            />
          </AccordionDetails>
        </Accordion>
      )}
    </div>
  );
};

const ModelContents = ({ modelDef }) => {
  const PropertyFormattersLeft = {
    version: (value) => <KeyValue property="API Version" value={value} />,
    hostname: (value) => <KeyValue property="Registrant" value={value} />,
    components: (value) => <KeyValue property="Components" value={value} />,
    subCategory: (value) => <KeyValue property="Sub-Category" value={value} />,
    modelVersion: (value) => <KeyValue property="Model Version" value={value} />,
    registrant: (value) => <KeyValue property="Registrant" value={value} />,
  };

  const getCompRelValue = () => {
    let components = 0;
    let relationships = 0;
    if (modelDef?.versionBasedData) {
      modelDef?.versionBasedData.forEach((modelDefVersion) => {
        components = components + modelDefVersion?.components_count;
        relationships = relationships + modelDefVersion?.relationships_count;
      });
    } else {
      components = modelDef?.components_count;
      relationships = modelDef?.relationships_count;
    }
    return {
      components,
      relationships,
    };
  };

  const metaDataLeft = {
    version: modelDef?.model?.version,
    modelVersion: modelDef?.model?.modelVersion,
    hostname: modelDef?.registrant?.hostname,
    components: getCompRelValue()?.components?.toString(),
    subCategory: modelDef?.model?.subCategory,
    registrant: modelDef?.registrant?.name,
  };

  const orderLeft = ['version', 'hostname', 'components', 'subCategory'];
  const orderdMetadataLeft = reorderObjectProperties(metaDataLeft, orderLeft);

  const PropertyFormattersRight = {
    category: (value) => <KeyValue property="Category" value={value} />,
    duplicates: (value) => <KeyValue property="Duplicates" value={value} />,
    relationships: (value) => <KeyValue property="Relationships" value={value} />,
  };

  const metaDataRight = {
    category: modelDef?.category?.name,
    duplicates: modelDef?.duplicates?.toString(),
    relationships: getCompRelValue().relationships.toString(),
  };
  const handleExport = () => {
    const a = document.createElement('a');
    a.href = '/api/meshmodels/export?id=' + modelDef.id;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };
  const orderRight = ['category', 'duplicates', 'relationships'];
  const orderdMetadataRight = reorderObjectProperties(metaDataRight, orderRight);
  const isShowStatusSelector = !Array.isArray(modelDef?.model.version);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <TitleWithImg displayName={modelDef.displayName} iconSrc={modelDef?.metadata?.svgColor} />
        <div style={{ display: 'flex', gap: '1rem' }}>
          {ExportAvailable ? (
            <Button
              aria-label="Export Model"
              variant="contained"
              alt="Export Model to OCI Image"
              onClick={handleExport}
              size="small"
              data-testid="export-model-button"
            >
              <DownloadIcon style={iconSmall} />
              Export
            </Button>
          ) : null}
          {isShowStatusSelector && <StatusChip entityData={modelDef} entityType="models" />}
        </div>
      </div>
      <RenderContents
        metaDataLeft={metaDataLeft}
        metaDataRight={metaDataRight}
        PropertyFormattersLeft={PropertyFormattersLeft}
        PropertyFormattersRight={PropertyFormattersRight}
        orderLeft={orderdMetadataLeft}
        orderRight={orderdMetadataRight}
        jsonData={modelDef}
      />
    </div>
  );
};

const ComponentContents = ({ componentDef }) => {
  const { data, isSuccess } = useGetComponentsQuery({
    params: {
      id: componentDef.id,
      apiVersion: componentDef.component.version,
      trim: false,
    },
  });
  const componentData = data?.components?.find((comp) => comp.id === componentDef.id);
  const PropertyFormattersLeft = {
    version: (value) => <KeyValue property="API Version" value={value} />,
    modelName: (value) => <KeyValue property="Model Name" value={value} />,
    kind: (value) => <KeyValue property="Kind" value={value} />,
    subCategory: (value) => <KeyValue property="Sub Category" value={value} />,
  };

  const metaDataLeft = {
    version: componentData?.component?.version,
    modelName: componentData?.model?.displayName,
    kind: componentData?.component.kind,
    subCategory: componentData?.model?.subCategory,
  };

  const orderLeft = ['version', 'modelName', 'kind'];
  const orderdMetadataLeft = reorderObjectProperties(metaDataLeft, orderLeft);

  const PropertyFormattersRight = {
    registrant: (value) => <KeyValue property="Registrant" value={value} />,
    duplicates: (value) => <KeyValue property="Duplicates" value={value} />,
    category: (value) => <KeyValue property="Category" value={value} />,
  };

  const metaDataRight = {
    registrant: componentData?.registrant?.hostname,
    duplicates: componentData?.duplicates?.toString(),
    category: componentData?.model?.category?.name,
  };

  const orderRight = ['registrant', 'duplicates'];
  const orderdMetadataRight = reorderObjectProperties(metaDataRight, orderRight);

  return (
    <>
      {isSuccess && componentData ? (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <TitleWithImg
              displayName={componentData?.displayName}
              iconSrc={componentData?.styles?.svgColor}
            />
          </div>
          <Description description={JSON.parse(componentData?.component?.schema)?.description} />
          <RenderContents
            metaDataLeft={metaDataLeft}
            metaDataRight={metaDataRight}
            PropertyFormattersLeft={PropertyFormattersLeft}
            PropertyFormattersRight={PropertyFormattersRight}
            orderLeft={orderdMetadataLeft}
            orderRight={orderdMetadataRight}
            jsonData={componentData}
          />
        </div>
      ) : (
        <JustifyAndAlignCenter>
          <CircularProgress size={24} />
        </JustifyAndAlignCenter>
      )}
    </>
  );
};

const RelationshipContents = ({ relationshipDef }) => {
  const PropertyFormattersLeft = {
    version: (value) => <KeyValue property="API Version" value={value} />,
    registrant: (value) => <KeyValue property="Registrant" value={value} />,
  };

  const metaDataLeft = {
    registrant: relationshipDef.model.registrant.name,
    modelName: relationshipDef.model?.displayName,
    version: relationshipDef.schemaVersion,
  };

  const orderLeft = ['registrant', 'version'];
  const orderdMetadataLeft = reorderObjectProperties(metaDataLeft, orderLeft);

  const PropertyFormattersRight = {
    registrant: (value) => <KeyValue property="Registrant" value={value} />,
    subType: (value) => <KeyValue property="Sub Type" value={value} />,
  };

  const metaDataRight = {
    registrant: relationshipDef.model.registrant.hostname,
    subType: relationshipDef.subType,
  };

  const orderRight = ['subType', 'registrant'];
  const orderdMetadataRight = reorderObjectProperties(metaDataRight, orderRight);

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <StyledTitle>{`${relationshipDef?.kind} :: ${relationshipDef.type} :: ${relationshipDef.subType}`}</StyledTitle>
        <Description description={relationshipDef?.metadata?.description} />
      </div>
      <RenderContents
        metaDataLeft={metaDataLeft}
        metaDataRight={metaDataRight}
        PropertyFormattersLeft={PropertyFormattersLeft}
        PropertyFormattersRight={PropertyFormattersRight}
        orderLeft={orderdMetadataLeft}
        orderRight={orderdMetadataRight}
        jsonData={relationshipDef}
      />
    </div>
  );
};

const RegistrantContent = ({ registrant }) => {
  const PropertyFormattersLeft = {
    models: (value) => <KeyValue property="Models" value={value} />,
    components: (value) => <KeyValue property="Components" value={value} />,
  };

  const metaDataLeft = {
    models: registrant?.summary?.models?.toString(),
    components: registrant.summary?.components?.toString(),
  };

  const orderLeft = ['models', 'components'];
  const orderdMetadataLeft = reorderObjectProperties(metaDataLeft, orderLeft);

  const PropertyFormattersRight = {
    relationships: (value) => <KeyValue property="Relationships" value={value} />,
    policies: (value) => <KeyValue property="Policies" value={value} />,
  };

  const metaDataRight = {
    relationships: registrant.summary?.relationships?.toString(),
    policies: registrant.summary?.policies?.toString(),
  };

  const orderRight = ['relationships', 'policies'];
  const orderdMetadataRight = reorderObjectProperties(metaDataRight, orderRight);
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <StyledTitle>{registrant?.hostname}</StyledTitle>
      </div>
      <RenderContents
        metaDataLeft={metaDataLeft}
        metaDataRight={metaDataRight}
        PropertyFormattersLeft={PropertyFormattersLeft}
        PropertyFormattersRight={PropertyFormattersRight}
        orderLeft={orderdMetadataLeft}
        orderRight={orderdMetadataRight}
        jsonData={registrant}
      />
    </div>
  );
};

const Description = ({ description }) => {
  const theme = useTheme();
  return (
    <div style={{ margin: '0.6rem 0' }}>
      <p
        style={{
          fontWeight: '600',
          margin: '0',
          fontSize: theme.typography.caption.fontSize,
          textTransform: 'uppercase',
          color: theme.palette.text.secondary,
        }}
      >
        Description
      </p>
      <p style={{ margin: '0', fontSize: theme.typography.fontFamily }}>{description}</p>
    </div>
  );
};

const TitleWithImg = ({ displayName, iconSrc }) => (
  <div style={{ display: 'flex', alignItems: 'center' }}>
    {iconSrc && (
      <img
        src={iconSrc}
        height="32px"
        width="32px"
        style={{ objectFit: 'contain', marginRight: '0.6rem' }}
      />
    )}
    <StyledTitle>{displayName}</StyledTitle>
  </div>
);

const StatusChip = ({ entityData, entityType }) => {
  const nextStatus = Object.values(REGISTRY_ITEM_STATES);
  const [updateEntityStatus] = useUpdateEntityStatusMutation();
  const { data: modelData, isSuccess } = useGetMeshModelsQuery({
    params: {
      id: entityData.model.id,
      version: entityData.model.version,
    },
  });

  const data = modelData?.models?.find((model) => model.id === entityData.id);
  const handleStatusChange = (e) => {
    updateEntityStatus({
      entityType: _.toLower(entityType),
      body: {
        id: data?.id || entityData.id,
        status: e.target.value,
        displayname: entityData.displayName,
      },
    });
  };

  // const icons = {
  //   [REGISTRY_ITEM_STATES_TO_TRANSITION_MAP.IGNORED]: () => <RemoveCircleIcon />,
  //   [REGISTRY_ITEM_STATES_TO_TRANSITION_MAP.ENABLED]: () => <AssignmentTurnedInIcon />,
  // };

  return (
    <FormControl style={{ flexDirection: 'inherit' }}>
      {isSuccess ? (
        <Select
          labelId="entity-status-select-label"
          id={data?.id}
          key={data?.id}
          size="small"
          value={data?.status || REGISTRY_ITEM_STATES.IGNORED}
          defaultValue={data?.status || REGISTRY_ITEM_STATES.IGNORED}
          onChange={(e) => handleStatusChange(e)}
          sx={{
            textTransform: 'capitalize',
          }}
          disabled={!isSuccess} // Disable the select when isSuccess is false
        >
          {nextStatus.map((status) => (
            <MenuItem style={{ textTransform: 'capitalize' }} value={status} key={status}>
              {status}
            </MenuItem>
          ))}
        </Select>
      ) : (
        <CircularProgress size={24} />
      )}
    </FormControl>
  );
};

const MeshModelDetails = ({ view, showDetailsData }) => {
  const isEmptyDetails =
    Object.keys(showDetailsData.data).length === 0 || showDetailsData.type === 'none';

  const renderEmptyDetails = () => (
    <p style={{ color: '#979797', margin: 'auto' }}>No {view} selected</p>
  );

  const getContent = (type) => {
    switch (type) {
      case MODELS:
        return <ModelContents modelDef={showDetailsData.data} />;
      case RELATIONSHIPS:
        return <RelationshipContents relationshipDef={showDetailsData.data} />;
      case COMPONENTS:
        return <ComponentContents componentDef={showDetailsData.data} />;
      case REGISTRANTS:
        return <RegistrantContent registrant={showDetailsData.data} />;
      default:
        return null;
    }
  };

  return (
    <DetailsContainer isEmpty={isEmptyDetails}>
      {isEmptyDetails ? renderEmptyDetails() : getContent(showDetailsData.type)}
    </DetailsContainer>
  );
};

export default MeshModelDetails;
