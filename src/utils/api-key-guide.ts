import { bold, cyan, yellow, green } from 'colorette';

export function showApiKeyGuide(): void {
  console.log(bold(yellow('\n📋 API Key Setup Guide\n')));
  
  console.log(bold('🟠 OpenAI API Key:'));
  console.log('  1. Visit ' + cyan('https://platform.openai.com/api-keys'));
  console.log('  2. Sign in or create an account');
  console.log('  3. Click "Create new secret key"');
  console.log('  4. Copy the key (it won\'t be shown again!)');
  console.log('  5. Run ' + cyan('npx -y ultra config') + ' to add it\n');
  
  console.log(bold('🔷 Google Gemini API Key:'));
  console.log('  1. Visit ' + cyan('https://aistudio.google.com/apikey'));
  console.log('  2. Sign in with your Google account');
  console.log('  3. Click "Create API Key"');
  console.log('  4. Select a Google Cloud project (or create one)');
  console.log('  5. Copy the API key');
  console.log('  6. Run ' + cyan('npx -y ultra config') + ' to add it\n');
  
  console.log(bold('🔵 Azure OpenAI:'));
  console.log('  1. Visit ' + cyan('https://portal.azure.com'));
  console.log('  2. Create an Azure OpenAI resource');
  console.log('  3. Go to Keys and Endpoint section');
  console.log('  4. Copy Key 1 or Key 2 and the endpoint URL');
  console.log('  5. Run ' + cyan('npx -y ultra config') + ' to add them\n');
  
  console.log(green('💡 Tip: Start with one provider first!'));
  console.log('   Gemini offers ' + bold('free tier') + ' for personal use');
  console.log('   OpenAI provides ' + bold('$5 free credits') + ' for new users\n');
}

export function showQuickApiKeyGuide(): void {
  console.log(yellow('\n🔑 Quick API Key Setup:'));
  console.log('  • OpenAI: ' + cyan('https://platform.openai.com/api-keys'));
  console.log('  • Gemini: ' + cyan('https://aistudio.google.com/apikey') + ' (free tier available)');
  console.log('  • Azure: ' + cyan('https://portal.azure.com') + ' → Azure OpenAI');
  console.log('\n  Run ' + cyan('npx -y ultra config') + ' to configure your keys\n');
}