<?php
namespace Amir;

/**
 * Description of Comm
 *
 * @author Amir <amirsanni@gmail.com>
 * @date 26-Oct-2016
 */


use Ratchet\MessageComponentInterface;
use Ratchet\ConnectionInterface;

class Comm implements MessageComponentInterface {
    protected $clients;
    private $rooms;

    public function __construct() {
        $this->clients = new \SplObjectStorage;
        $this->rooms = [];
    }

    /*
    ********************************************************************************************************************************
    ********************************************************************************************************************************
    ********************************************************************************************************************************
    ********************************************************************************************************************************
    ********************************************************************************************************************************
    */
    
    /**
     * 
     * @param ConnectionInterface $conn
     */
    public function onOpen(ConnectionInterface $conn) {
        // Store the new connection
        $this->clients->attach($conn);
    }

    /*
    ********************************************************************************************************************************
    ********************************************************************************************************************************
    ********************************************************************************************************************************
    ********************************************************************************************************************************
    ********************************************************************************************************************************
    */
    
    /**
     * 
     * @param ConnectionInterface $from
     * @param type $msg
     */
    public function onMessage(ConnectionInterface $from, $msg) {
        $data = json_decode($msg);
        $action = $data->action;
        $room = isset($data->room) ? $data->room : "";
        
        if(($action == 'subscribe') && $room){
            //subscribe user to room only if he hasn't subscribed
            
            //if room exist and user is yet to subscribe, then subscibe him to room
            //OR
            //if room does not exist, create it by adding user to it
            if((array_key_exists($room, $this->rooms) && !in_array($from, $this->rooms[$room])) || !array_key_exists($room, $this->rooms)){                
                if(isset($this->rooms[$room]) && count($this->rooms[$room]) >= 2){
                    //maximum number of connection reached
                    $msg_to_send = json_encode(['action'=>'subRejected']);
                
                    $from->send($msg_to_send);
                }
                
                else{
                    $this->rooms[$room][] = $from;//subscribe user to room
                
                    $this->notifyUsersOfConnection($room, $from);
                }
            }
            
            else{
                //tell user he has subscribed on another device/browser
                $msg_to_send = json_encode(['action'=>'subRejected']);
                
                $from->send($msg_to_send);
            }
        }
        
        //for other actions
        else if($room && isset($this->rooms[$room])){
            //send to everybody subscribed to the room received except the sender
            foreach($this->rooms[$room] as $client){
                if ($client !== $from) {
                    $client->send($msg);
                }
            }
        }
    }

    /*
    ********************************************************************************************************************************
    ********************************************************************************************************************************
    ********************************************************************************************************************************
    ********************************************************************************************************************************
    ********************************************************************************************************************************
    */
    
    /**
     * 
     * @param ConnectionInterface $conn
     */
    public function onClose(ConnectionInterface $conn) {
        // The connection is closed, remove connection
        $this->clients->detach($conn);
        
        if(count($this->rooms)){//if there is at least one room created
            foreach($this->rooms as $room=>$arr_of_subscribers){//loop through the rooms
                foreach ($arr_of_subscribers as $key=>$ratchet_conn){//loop through the users connected to each room
                    if($ratchet_conn == $conn){//if the disconnecting user subscribed to this room
                        unset($this->rooms[$room][$key]);//remove him from the room
                        
                        //notify other subscribers that he has disconnected
                        $this->notifyUsersOfDisconnection($room, $conn);
                    }
                }
            }
        }
    }

    /*
    ********************************************************************************************************************************
    ********************************************************************************************************************************
    ********************************************************************************************************************************
    ********************************************************************************************************************************
    ********************************************************************************************************************************
    */
    
    /**
     * 
     * @param ConnectionInterface $conn
     * @param \Exception $e
     */
    public function onError(ConnectionInterface $conn, \Exception $e) {
        //echo "An error has occurred: {$e->getMessage()}\n";

        $conn->close();
    }
    
    /*
    ********************************************************************************************************************************
    ********************************************************************************************************************************
    ********************************************************************************************************************************
    ********************************************************************************************************************************
    ********************************************************************************************************************************
    */
    
    /**
     * 
     * @param type $room
     * @param type $from
     */
    private function notifyUsersOfConnection($room, $from){
                        
        //echo "User subscribed to room ".$room ."\n";

        $msg_to_broadcast = json_encode(['action'=>'newSub', 'room'=>$room]);

        //notify user that someone has joined room
        foreach($this->rooms[$room] as $client){
            if ($client !== $from) {
                $client->send($msg_to_broadcast);
            }
        }
    }
    
    /*
    ********************************************************************************************************************************
    ********************************************************************************************************************************
    ********************************************************************************************************************************
    ********************************************************************************************************************************
    ********************************************************************************************************************************
    */
    
    private function notifyUsersOfDisconnection($room, $from){
        $msg_to_broadcast = json_encode(['action'=>'imOffline', 'room'=>$room]);

        //notify user that remote has left the room
        foreach($this->rooms[$room] as $client){
            if ($client !== $from) {
                $client->send($msg_to_broadcast);
            }
        }
    }
}
