package Uploader {
	import flash.display.MovieClip;
	import flash.external.*;
	import Uploader.*;
	
	/**
	* Hlavni trida
	*/
	public class UploaderTest extends MovieClip {
		
		public var uploader:Uploader;
		
		/* konstruktor */
		public function UploaderTest(){
			uploader = new Uploader();
			goInit();
		}
		
		public function goInit():void{
			ExternalInterface.call('SZN.FlashUploader.init');
		}		
	}
}