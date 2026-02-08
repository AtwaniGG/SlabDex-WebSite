import { Job } from 'bullmq';

export interface ParseMetadataPayload {
  assetRawId: string;
}

interface NftAttribute {
  trait_type: string;
  value: string | number;
}

// Regex fallbacks for when structured attributes are missing
const CERT_PATTERN = /(?:cert(?:ificate)?[#\s:_-]*|#)(\d{6,})/i;
const GRADE_PATTERN = /(?:PSA|BGS|CGC)\s*(\d+(?:\.\d+)?)/i;
const GRADER_PATTERN = /(PSA|BGS|CGC)/i;

/**
 * Extract a field from the attributes array by trait_type.
 * Courtyard uses structured attributes like:
 *   { "trait_type": "Cert Number", "value": "23303316" }
 *   { "trait_type": "Grading Company", "value": "PSA" }
 *   { "trait_type": "Grade", "value": "10" }
 */
function getAttr(attributes: NftAttribute[], traitType: string): string | null {
  const attr = attributes.find(
    (a) => a.trait_type.toLowerCase() === traitType.toLowerCase(),
  );
  return attr ? String(attr.value) : null;
}

export function parseSlabFromMetadata(
  metadata: Record<string, unknown>,
  name?: string,
  description?: string,
) {
  const attributes = (metadata.attributes as NftAttribute[]) || [];
  const hasAttributes = attributes.length > 0;

  // Try structured attributes first (Courtyard format)
  let certNumber = getAttr(attributes, 'Cert Number')
    || getAttr(attributes, 'cert_number')
    || getAttr(attributes, 'Certificate Number');

  let grader = getAttr(attributes, 'Grading Company')
    || getAttr(attributes, 'grading_company')
    || getAttr(attributes, 'Grader');

  let grade = getAttr(attributes, 'Grade')
    || getAttr(attributes, 'grade');

  let setName = getAttr(attributes, 'Set')
    || getAttr(attributes, 'set')
    || getAttr(attributes, 'Set Name');

  let cardName = getAttr(attributes, 'Card Name')
    || getAttr(attributes, 'card_name')
    || getAttr(attributes, 'Name');

  let cardNumber = getAttr(attributes, 'Card Number')
    || getAttr(attributes, 'card_number')
    || getAttr(attributes, 'Number');

  const variant = getAttr(attributes, 'Variant')
    || getAttr(attributes, 'variant')
    || getAttr(attributes, 'Edition');

  // Image: check metadata fields
  const imageUrl = (metadata.image as string)
    || (metadata.image_url as string)
    || ((metadata.media as Record<string, string>)?.image_url)
    || null;

  // Regex fallback from name/description if structured fields are missing
  if (!hasAttributes || (!certNumber && !grader)) {
    const text = [name, description, JSON.stringify(metadata)].filter(Boolean).join(' ');

    if (!certNumber) {
      const certMatch = text.match(CERT_PATTERN);
      certNumber = certMatch?.[1] ?? null;
    }
    if (!grade) {
      const gradeMatch = text.match(GRADE_PATTERN);
      grade = gradeMatch?.[1] ?? null;
    }
    if (!grader) {
      const graderMatch = text.match(GRADER_PATTERN);
      grader = graderMatch?.[1]?.toUpperCase() ?? null;
    }
  }

  // Use NFT name as card name fallback
  if (!cardName && name) {
    cardName = name;
  }

  // Determine parse status
  let parseStatus: 'ok' | 'partial' | 'fail' = 'fail';
  if (certNumber && grader && grade) {
    parseStatus = 'ok';
  } else if (certNumber) {
    parseStatus = 'partial';
  }

  return {
    certNumber,
    grader,
    grade,
    setName,
    cardName,
    cardNumber,
    variant,
    imageUrl,
    parseStatus,
  };
}

export default async function parseMetadataJob(job: Job<ParseMetadataPayload>) {
  const { assetRawId } = job.data;
  console.log(`Parsing metadata for asset ${assetRawId}`);
  // Used by BullMQ worker — wired in future milestone
}
