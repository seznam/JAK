package Uploader {
	import flash.external.*;
	/* obstarava komunikaci flash > js a castecne naopak */
	public class Comunicator {
		/* aktivni id javascriptove aplikace, ktera s flashem prave komunikuje */
		public var appsId:String;
		/* reference na hlavni tridu balicku */
		public var main:Object;
		
		public function Comunicator(main:Object){
			this.main = main;
			/* nastaveni aktivniho id z javascriptu */
			ExternalInterface.addCallback("setJsAppId",setJsAppId);
			/* vraceni aktivniho id do javascriptu */
			ExternalInterface.addCallback("getJsAppId",getJsAppId);
		}
		/* vola js debug */
		public function callDebug(param:String):void{
			try {
				ExternalInterface.call("debug",param);
			} catch(e:Error){
				trace(e);
			}
		}		
		/* z js nastavuje aktivnin id*/
		public function setJsAppId(param:String):void{
			this.appsId = param;
			this.main.setActiveId(param)
		}
		
		/* vraci aktivni id */
		public function getJsAppId():String{
			return this.main.getActiveId();
		}
		/* vola metodu js bez parametru */
		public function callJsAps(methodName:String):*{
			return ExternalInterface.call("SZN.FlashUploader.callBack",appsId,methodName);
		}
		/* vola metodu js s parametrem typu String */
		public function callJsApsStr(methodName:String,param:String):*{
			return ExternalInterface.call("SZN.FlashUploader.callBack",appsId,methodName,param);
		}
		/* vola metodu js s parametrem typu Number */
		public function callJsApsInt(methodName:String,param:Number):*{
			return ExternalInterface.call("SZN.FlashUploader.callBack",appsId,methodName,param);
		}
		/* vola metodu js s parametrem typu Array */
		public function callJsApsArr(methodName:String,param:Array):*{
			return ExternalInterface.call("SZN.FlashUploader.callBack",appsId,methodName,param);
		}
		/* vola metodu js s parametrem typo Object */
		public function callJsApsObj(methodName:String,param:Object):*{
			return ExternalInterface.call("SZN.FlashUploader.callBack",appsId,methodName,param);
		}
		
	}
}
