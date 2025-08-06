<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Minishlink\WebPush\VAPID;

class GenerateVapidKeys extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'webpush:vapid {--show : Display the keys instead of storing them}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate VAPID keys for web push notifications';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $keys = VAPID::createVapidKeys();

        if ($this->option('show')) {
            $this->info('VAPID Public Key:');
            $this->line($keys['publicKey']);
            $this->newLine();
            $this->info('VAPID Private Key:');
            $this->line($keys['privateKey']);
            $this->newLine();
            $this->info('Add these to your .env file:');
            $this->line('VAPID_PUBLIC_KEY=' . $keys['publicKey']);
            $this->line('VAPID_PRIVATE_KEY=' . $keys['privateKey']);
        } else {
            $envPath = base_path('.env');
            $envContent = file_get_contents($envPath);

            // Check if keys already exist
            if (strpos($envContent, 'VAPID_PUBLIC_KEY=') !== false) {
                if (!$this->confirm('VAPID keys already exist. Do you want to replace them?', false)) {
                    $this->info('VAPID key generation cancelled.');
                    return;
                }

                // Remove existing keys
                $envContent = preg_replace('/^VAPID_PUBLIC_KEY=.*$/m', '', $envContent);
                $envContent = preg_replace('/^VAPID_PRIVATE_KEY=.*$/m', '', $envContent);
                $envContent = preg_replace('/\n\n+/', "\n", $envContent);
            }

            // Add new keys
            $envContent .= "\n# VAPID Keys for Web Push Notifications\n";
            $envContent .= "VAPID_PUBLIC_KEY=" . $keys['publicKey'] . "\n";
            $envContent .= "VAPID_PRIVATE_KEY=" . $keys['privateKey'] . "\n";

            file_put_contents($envPath, $envContent);

            $this->info('VAPID keys generated and added to .env file successfully!');
            $this->warn('Remember to restart your application to load the new environment variables.');
        }
    }
}