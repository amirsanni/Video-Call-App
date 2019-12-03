<?php

namespace Ratchet\RFC6455\Test\Unit\Messaging;

use Ratchet\RFC6455\Messaging\CloseFrameChecker;
use Ratchet\RFC6455\Messaging\Frame;
use Ratchet\RFC6455\Messaging\Message;
use Ratchet\RFC6455\Messaging\MessageBuffer;
use React\EventLoop\Factory;

class MessageBufferTest extends \PHPUnit_Framework_TestCase
{
    /**
     * This is to test that MessageBuffer can handle a large receive
     * buffer with many many frames without blowing the stack (pre-v0.4 issue)
     */
    public function testProcessingLotsOfFramesInASingleChunk() {
        $frame = new Frame('a', true, Frame::OP_TEXT);

        $frameRaw = $frame->getContents();

        $data = str_repeat($frameRaw, 1000);

        $messageCount = 0;

        $messageBuffer = new MessageBuffer(
            new CloseFrameChecker(),
            function (Message $message) use (&$messageCount) {
                $messageCount++;
                $this->assertEquals('a', $message->getPayload());
            },
            null,
            false
        );

        $messageBuffer->onData($data);

        $this->assertEquals(1000, $messageCount);
    }

    public function testProcessingMessagesAsynchronouslyWhileBlockingInMessageHandler() {
        $loop = Factory::create();

        $frameA = new Frame('a', true, Frame::OP_TEXT);
        $frameB = new Frame('b', true, Frame::OP_TEXT);

        $bReceived = false;

        $messageBuffer = new MessageBuffer(
            new CloseFrameChecker(),
            function (Message $message) use (&$messageCount, &$bReceived, $loop) {
                $payload = $message->getPayload();
                $bReceived = $payload === 'b';

                if (!$bReceived) {
                    $loop->run();
                }
            },
            null,
            false
        );

        $loop->addPeriodicTimer(0.1, function () use ($messageBuffer, $frameB, $loop) {
            $loop->stop();
            $messageBuffer->onData($frameB->getContents());
        });

        $messageBuffer->onData($frameA->getContents());

        $this->assertTrue($bReceived);
    }
}