<?php

namespace Database\Seeders;

use App\Models\ChatbotFaq;
use App\Models\ChatbotKnowledgeVersion;
use Illuminate\Database\Seeder;

class ChatbotFaqSeeder extends Seeder
{
    public function run(): void
    {
        $faqs = [
            [
                'question' => 'How does canine blood donation work?',
                'approved_answer' => 'A veterinary team evaluates a dog, confirms blood type and suitability, and performs any needed testing before a donation. Contact a participating clinic to learn about its screening process. A veterinarian makes all medical decisions.',
                'category' => 'donation',
                'visibility_scope' => 'public',
                'keywords' => 'donate blood process veterinary screening',
            ],
            [
                'question' => 'What blood types do dogs have?',
                'approved_answer' => 'Dogs have several blood group systems, including Dog Erythrocyte Antigen (DEA) groups. DEA 1 is especially important in transfusion medicine, but blood type alone does not establish compatibility. A veterinarian determines the testing needed for each patient.',
                'category' => 'blood-types',
                'visibility_scope' => 'public',
                'keywords' => 'DEA canine blood group type',
            ],
            [
                'question' => 'How are blood type and crossmatching used?',
                'approved_answer' => 'Blood typing identifies relevant blood group antigens. Crossmatching checks for reactions between donor and recipient blood samples. The veterinary team decides which tests are appropriate; this chatbot cannot determine compatibility or authorize a transfusion.',
                'category' => 'testing',
                'visibility_scope' => 'public',
                'keywords' => 'typing crossmatch compatibility test',
            ],
            [
                'question' => 'Who decides if a dog is eligible to donate?',
                'approved_answer' => 'A veterinarian or authorized clinic assesses each dog using its medical history, examination, and clinic screening criteria. CanineLink information or automated recommendations do not establish eligibility or replace veterinary judgment.',
                'category' => 'eligibility',
                'visibility_scope' => 'public',
                'keywords' => 'eligible screening health veterinarian',
            ],
            [
                'question' => 'How can I register my dog as a potential donor?',
                'approved_answer' => 'Create a dog-owner account, choose a participating clinic, and submit your dog’s profile. The clinic reviews the registration and may request additional information or an examination. Registration does not guarantee eligibility or a donation request.',
                'category' => 'registration',
                'visibility_scope' => 'public',
                'keywords' => 'register account profile clinic dog owner',
            ],
            [
                'question' => 'How do emergency blood requests work?',
                'approved_answer' => 'A clinic creates an emergency request and CanineLink can relay it to potential donors. Owners choose whether to respond. The clinic verifies the donor and performs required veterinary testing before any donation or transfusion.',
                'category' => 'emergency-requests',
                'visibility_scope' => 'public',
                'keywords' => 'emergency request relay accept decline clinic',
            ],
            [
                'question' => 'When is donor location shared?',
                'approved_answer' => 'A dog owner controls approximate-location sharing and may grant or revoke temporary sharing for an accepted emergency request. Do not share an exact address in public chat. Contact the clinic through the authenticated request workflow if coordination is needed.',
                'category' => 'privacy',
                'visibility_scope' => 'donor',
                'keywords' => 'location privacy consent sharing',
            ],
            [
                'question' => 'What should a clinic do after a donor accepts?',
                'approved_answer' => 'Follow the clinic’s emergency workflow to verify the arriving donor, confirm the donor’s identity using the approved verification code or QR process, and complete clinical screening and compatibility testing. A chatbot recommendation does not authorize a transfusion.',
                'category' => 'clinic-workflow',
                'visibility_scope' => 'clinic',
                'keywords' => 'clinic accept QR verification crossmatch',
            ],
        ];

        foreach ($faqs as $faq) {
            $record = ChatbotFaq::updateOrCreate(
                ['question' => $faq['question'], 'visibility_scope' => $faq['visibility_scope']],
                [
                    ...$faq,
                    'status' => 'approved',
                    'reviewed_at' => now(),
                ],
            );
            ChatbotKnowledgeVersion::firstOrCreate(
                ['faq_id' => $record->id, 'version' => $record->version],
                [
                    'previous_answer' => null,
                    'revised_answer' => $record->approved_answer,
                    'change_reason' => 'Initial reviewed FAQ',
                    'changed_by' => null,
                    'created_at' => now(),
                ],
            );
        }
    }
}
