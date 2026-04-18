#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function generateMessage(target) {
  const businessName = target.business.split(' — ')[0];
  const signal = (target.signal || '').split('.')[0].toLowerCase();

  // Generate a compelling connection message
  const message = `Hi ${target.name},

I've been impressed by your work at ${businessName}. ${target.signal ? `Specifically, I noticed ${signal}.` : ''}

I work with execution-stalled operators and CROs to systematize their GTM — turning decision cycles from weeks into days, and getting revenue predictability locked in.

Given your position at this moment, I think there's a compelling conversation around how you could accelerate growth through better execution rhythm and cross-functional alignment.

Would love to grab 15 minutes and explore if it's a fit.

Best regards`;

  return message;
}

async function generateAllMessages() {
  console.log('📝 Generating AI messages for all leads...\n');

  try {
    const { data: targets, error } = await supabase
      .from('gtm_targets')
      .select('id, name, business, signal, draft_message')
      .limit(500);

    if (error) {
      console.error('Error fetching targets:', error);
      return;
    }

    console.log(`Found ${targets.length} leads\n`);

    let updated = 0;
    let skipped = 0;

    for (const target of targets) {
      if (target.draft_message) {
        console.log(`⏭️  ${target.name} — already has message`);
        skipped++;
        continue;
      }

      const message = await generateMessage(target);

      const { error: updateError } = await supabase
        .from('gtm_targets')
        .update({ draft_message: message, updated_at: new Date().toISOString() })
        .eq('id', target.id);

      if (updateError) {
        console.log(`❌ ${target.name} — ${updateError.message}`);
      } else {
        console.log(`✓ ${target.name} — message generated`);
        updated++;
      }
    }

    console.log(`\n✅ Complete! Updated: ${updated}, Skipped: ${skipped}`);
  } catch (e) {
    console.error('Error:', e.message);
  }
}

generateAllMessages();
